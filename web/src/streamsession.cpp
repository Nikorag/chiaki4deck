#include "streamsession.h"

#include <QtCore/QString>

#include "chiaki/session.h"

static void FfmpegFrameCb(ChiakiFfmpegDecoder *decoder, void *user);

Napi::FunctionReference StreamSession::constructor;

Napi::Object StreamSession::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "StreamSession",{

    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("StreamSession", func);
    return exports;
}

StreamSession::StreamSession(const Napi::CallbackInfo& info) : ObjectWrap<StreamSession>(info) {
    auto console_config = info[0].As<Napi::Object>();

    ChiakiErrorCode err;
    chiaki_log_init(&log, CHIAKI_LOG_ALL & ~CHIAKI_LOG_VERBOSE, chiaki_log_cb_print, nullptr);

    CHIAKI_LOGI(&log, "Starting Stream\n");

    ffmpeg_decoder = new ChiakiFfmpegDecoder;
    ChiakiLogSniffer sniffer;
    chiaki_log_sniffer_init(&sniffer, CHIAKI_LOG_ALL, &log);
    err = chiaki_ffmpeg_decoder_init(ffmpeg_decoder,
            chiaki_log_sniffer_get_log(&sniffer),
            CHIAKI_CODEC_H264,
            NULL,
            NULL, FfmpegFrameCb, this);
    if(err != CHIAKI_ERR_SUCCESS)
    {
        QString log = QString::fromUtf8(chiaki_log_sniffer_get_buffer(&sniffer));
        chiaki_log_sniffer_fini(&sniffer);
        throw Napi::Error::New(info.Env(), "Failed to initialize FFMPEG Decoder:\n");
    }
    ffmpeg_decoder->log = &log;

    QByteArray host_str = QString::fromStdString(console_config.Get("address").As<Napi::String>()).toUtf8();
    int targetInt = console_config.Get("hostType").As<Napi::Number>();
    auto target = static_cast<ChiakiTarget>(targetInt);

    ChiakiConnectVideoProfile video_profile = {};
    video_profile.bitrate = 15000;
    video_profile.codec = ChiakiCodec::CHIAKI_CODEC_H264;
    video_profile.height = 1280;
    video_profile.width = 1920;
    video_profile.max_fps = 60;

    ChiakiConnectInfo chiaki_connect_info = {};
    chiaki_connect_info.ps5 = chiaki_target_is_ps5(target);
    chiaki_connect_info.host = host_str.constData();
    chiaki_connect_info.video_profile = video_profile;
    chiaki_connect_info.video_profile_auto_downgrade = true;
    chiaki_connect_info.enable_keyboard = false;
    chiaki_connect_info.enable_dualsense = false;

    printf("Regist Key %s\n", QString::fromStdString(console_config.Get("registKey").As<Napi::String>()).toStdString().c_str());

    QByteArray registKey = QString::fromStdString(console_config.Get("registKey").As<Napi::String>()).toUtf8();
    QString morning_str = QString::fromStdString(console_config.Get("morning").As<Napi::String>());
    QByteArray morning_hex = QByteArray::fromHex(morning_str.toLatin1());

    // printf("Received Hex String: %s\n", morning_hex.c_str());
    //
    // size_t hexIndex = 0;
    //
    // for (size_t i = 0; i < sizeof(chiaki_connect_info.morning) / sizeof(chiaki_connect_info.morning[0]); ++i) {
    //     std::string byteString = morning_hex.substr(hexIndex, 2);
    //     chiaki_connect_info.morning[i] = static_cast<uint8_t>(std::stoi(byteString, nullptr, 16));
    //     hexIndex += 2;
    // }
    //
    // printf("Morning: %s\n", chiaki_connect_info.morning);

    memcpy(chiaki_connect_info.regist_key, registKey.constData(), sizeof(chiaki_connect_info.regist_key));
    memcpy(chiaki_connect_info.morning, morning_hex.data(), sizeof(chiaki_connect_info.morning));

    err = chiaki_session_init(&session, &chiaki_connect_info, &log);
    if(err != CHIAKI_ERR_SUCCESS)
        throw Napi::Error::New(info.Env(), "Chiaki Session Init failed");
        //throw Napi::Error::New(info.Env(), "Chiaki Session Init failed: " + QString::fromLocal8Bit(chiaki_error_string(err)).toStdString().c_str());

    chiaki_session_set_video_sample_cb(&session, chiaki_ffmpeg_decoder_video_sample_cb, ffmpeg_decoder);

    err = chiaki_session_start(&session);
}

static void FfmpegFrameCb(ChiakiFfmpegDecoder *decoder, void *user)
{
    auto session = reinterpret_cast<StreamSession *>(user);
    printf("Callback");
}
