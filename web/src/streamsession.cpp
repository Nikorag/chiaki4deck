#include "streamsession.h"

#include <iostream>
#include <QtCore/QString>
#include "chiaki/session.h"

static void FfmpegFrameCb(ChiakiFfmpegDecoder *decoder, void *user);
void FinalizeTSFN(Napi::Env env, void* data, void* context);

Napi::FunctionReference StreamSession::constructor;

Napi::Object StreamSession::Init(const Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "StreamSession",{
        InstanceMethod("getFrame", &StreamSession::GetFrameFromDecoder),
        InstanceMethod("stopSession", &StreamSession::StopSession)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("StreamSession", func);
    return exports;
}

StreamSession::StreamSession(const Napi::CallbackInfo& info) : ObjectWrap<StreamSession>(info) { // NOLINT(*-pro-type-member-init)
    const auto console_config = info[0].As<Napi::Object>();

    Ref();

    ffmpegFrameCb = TSFN::New(
      info.Env(),
      info[1].As<Napi::Function>(), // JavaScript function called asynchronously
      "Resource Name",        // Name
      0,                      // Unlimited queue
      1,                      // Only one thread will use this initially
      this,
      [](Napi::Env, FinalizerDataType *,
         const Context *ctx) { // Finalizer used to clean threads up
        delete ctx;
      });

    chiaki_log_init(&log, CHIAKI_LOG_ALL & ~CHIAKI_LOG_VERBOSE, chiaki_log_cb_print, nullptr);

    CHIAKI_LOGI(&log, "Starting Stream\n");

    ffmpeg_decoder = new ChiakiFfmpegDecoder;
    ChiakiLogSniffer sniffer;
    chiaki_log_sniffer_init(&sniffer, CHIAKI_LOG_ALL, &log);
    ChiakiErrorCode err = chiaki_ffmpeg_decoder_init(ffmpeg_decoder,
                                                     chiaki_log_sniffer_get_log(&sniffer),
                                                     CHIAKI_CODEC_H264,
                                                     nullptr,
                                                     nullptr, FfmpegFrameCb, this);
    if(err != CHIAKI_ERR_SUCCESS)
    {
        QString log = QString::fromUtf8(chiaki_log_sniffer_get_buffer(&sniffer));
        chiaki_log_sniffer_fini(&sniffer);
        throw Napi::Error::New(info.Env(), "Failed to initialize FFMPEG Decoder:\n");
    }
    ffmpeg_decoder->log = &log;

    const QByteArray host_str = QString::fromStdString(console_config.Get("address").As<Napi::String>()).toUtf8();
    int targetInt = console_config.Get("hostType").As<Napi::Number>();
    const auto target = static_cast<ChiakiTarget>(targetInt);

    ChiakiConnectVideoProfile video_profile = {};
    video_profile.bitrate = 15000;
    video_profile.codec = ChiakiCodec::CHIAKI_CODEC_H265;
    video_profile.height = 1080;
    video_profile.width = 1920;
    video_profile.max_fps = 60;

    ChiakiConnectInfo chiaki_connect_info = {};
    chiaki_connect_info.ps5 = chiaki_target_is_ps5(target);
    chiaki_connect_info.host = host_str.constData();
    chiaki_connect_info.video_profile = video_profile;
    chiaki_connect_info.video_profile_auto_downgrade = true;
    chiaki_connect_info.enable_keyboard = false;
    chiaki_connect_info.enable_dualsense = false;

    const QByteArray registKey = QString::fromStdString(console_config.Get("registKey").As<Napi::String>()).toUtf8();
    const QString morning_str = QString::fromStdString(console_config.Get("morning").As<Napi::String>());
    QByteArray morning_hex = QByteArray::fromHex(morning_str.toLatin1());

    memcpy(chiaki_connect_info.regist_key, registKey.constData(), sizeof(chiaki_connect_info.regist_key));
    memcpy(chiaki_connect_info.morning, morning_hex.data(), sizeof(chiaki_connect_info.morning));

    err = chiaki_session_init(&session, &chiaki_connect_info, &log);
    if(err != CHIAKI_ERR_SUCCESS)
        throw Napi::Error::New(info.Env(), "Chiaki Session Init failed");

    chiaki_session_set_video_sample_cb(&session, chiaki_ffmpeg_decoder_video_sample_cb, ffmpeg_decoder);

    err = chiaki_session_start(&session);
}

void StreamSession::StopSession(const Napi::CallbackInfo& info) {
    chiaki_session_stop(&session);
}

void jsFfmpegFramCb(Napi::Env env, Napi::Function callback, Context* context, DataType* data) {
    callback.Call({});
}

static void FfmpegFrameCb(ChiakiFfmpegDecoder *decoder, void *user)
{
    const auto session = reinterpret_cast<StreamSession *>(user);
    session->ffmpegFrameCb.BlockingCall();
}

void FinalizeTSFN(Napi::Env env, void* data, void* context) {

}

Napi::Value StreamSession::GetFrameFromDecoder(const Napi::CallbackInfo& info) {
    const AVPixelFormat pixel_format = chiaki_ffmpeg_decoder_get_pixel_format(ffmpeg_decoder);

    AVFrame *inputFrame = chiaki_ffmpeg_decoder_pull_frame(ffmpeg_decoder, /*hw_download*/ true);
    if(!inputFrame)
        return info.Env().Undefined();

    // Get the frame dimensions
    const int width = inputFrame->width;
    Napi::Number returnWidth = Napi::Number::New(info.Env(), width);
    const int height = inputFrame->height;
    Napi::Number returnHeight = Napi::Number::New(info.Env(), height);

    uint8_t *rgbaBuffer;
    decodeAndConvertToRGBA(inputFrame, &rgbaBuffer, width, height, pixel_format);

    const size_t bufferSize = width * height * 4;

    Napi::Object responseObject = Napi::Object::New(info.Env());
    Napi::ArrayBuffer frameBuffer = Napi::ArrayBuffer::New(info.Env(), rgbaBuffer, bufferSize);
    responseObject.Set("frameData", frameBuffer);
    responseObject.Set("width", returnWidth);
    responseObject.Set("height", returnHeight);

    av_frame_free(&inputFrame);
    delete[] rgbaBuffer;

    return responseObject;
}

void StreamSession::decodeAndConvertToRGBA(AVFrame *inputFrame, uint8_t **outputBuffer, const int width, const int height, const AVPixelFormat pixelFormat) {
    *outputBuffer = static_cast<uint8_t *>(malloc(width * height * 4)); // 4 bytes per pixel (RGBA)

    const auto sampleFormat = static_cast<AVSampleFormat>(inputFrame->format);
    const int bytesPerSampleY = av_get_bytes_per_sample(sampleFormat);

    int count = 0;
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            // Calculate the correct offsets for Y plane
            const uint8_t *srcDataY = inputFrame->data[0] + (y * inputFrame->linesize[0]) + (x * bytesPerSampleY);

            // Calculate the correct offsets for U and V planes (if present)
            const uint8_t *srcDataU = inputFrame->data[1] + (y / 2 * inputFrame->linesize[1]) + (x / 2 * av_get_bytes_per_sample(sampleFormat));
            const uint8_t *srcDataV = inputFrame->data[2] + (y / 2 * inputFrame->linesize[2]) + (x / 2 * av_get_bytes_per_sample(sampleFormat));

            // Calculate the destination offset
            uint8_t *destData = *outputBuffer + ((y * width + x) * 4);

            convertYUVtoRGBA(srcDataY, srcDataU, srcDataV, destData, pixelFormat);
            count++;
        }
    }
}

void StreamSession::convertYUVtoRGBA(const uint8_t *srcDataY, const uint8_t *srcDataU, const uint8_t *srcDataV, uint8_t *destData, const AVPixelFormat pixelFormat) {
    uint8_t Y, U, V;

    switch (pixelFormat) {
        case AV_PIX_FMT_YUV420P:
            Y = *srcDataY;
            U = *srcDataU;
            V = *srcDataV;

            // Conversion to RGBA (assuming no scaling for simplicity)
            destData[0] = Y + 1.402 * (V - 128); // Red
            destData[1] = Y - 0.344136 * (U - 128) - 0.714136 * (V - 128); // Green
            destData[2] = Y + 1.772 * (U - 128); // Blue
            destData[3] = 255; // Alpha (fully opaque)
        break;

        default:
            CHIAKI_LOGI(&log, "Unsupported Pixel Format\n");
            break;
    }
}