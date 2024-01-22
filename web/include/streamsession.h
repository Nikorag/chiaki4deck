#ifndef STREAMSESSION_H
#define STREAMSESSION_H
#include <napi.h>

#include "chiaki/ffmpegdecoder.h"
#include "chiaki/session.h"

class StreamSession : public Napi::ObjectWrap<StreamSession> {

public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    explicit StreamSession(const Napi::CallbackInfo& info);

private:
    ChiakiSession session;
    static Napi::FunctionReference constructor;
    ChiakiFfmpegDecoder *ffmpeg_decoder;
    ChiakiLog log;
    AVBufferRef *hw_device_ctx;

};
#endif //STREAMSESSION_H
