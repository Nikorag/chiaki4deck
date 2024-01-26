#ifndef STREAMSESSION_H
#define STREAMSESSION_H
#include <napi.h>

#include "chiaki/ffmpegdecoder.h"
#include "chiaki/session.h"

class StreamSession;
using Context = StreamSession;
using DataType = void;
void jsFfmpegFramCb(Napi::Env env, Napi::Function callback, Context* context, DataType* data);
using TSFN = Napi::TypedThreadSafeFunction<Context, DataType, jsFfmpegFramCb>;
using FinalizerDataType = void;

class StreamSession : public Napi::ObjectWrap<StreamSession> {

public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    void StopSession(const Napi::CallbackInfo& info);
    explicit StreamSession(const Napi::CallbackInfo& info);
    Napi::Value GetFrameFromDecoder(const Napi::CallbackInfo& info);
    TSFN ffmpegFrameCb;

private:
    ChiakiSession session;
    static Napi::FunctionReference constructor;

    ChiakiFfmpegDecoder *ffmpeg_decoder;
    ChiakiLog log;
    AVBufferRef *hw_device_ctx;

    void decodeAndConvertToRGBA(AVFrame *inputFrame, uint8_t **outputBuffer, int width, int height, AVPixelFormat pixelFormat);
    void convertYUVtoRGBA(const uint8_t *srcDataY, const uint8_t *srcDataU, const uint8_t *srcDataV, uint8_t *destData, AVPixelFormat pixelFormat);
};
#endif //STREAMSESSION_H
