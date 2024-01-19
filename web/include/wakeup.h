#ifndef WAKEUP_H
#define WAKEUP_H
#include <napi.h>

class Wakeup : public Napi::ObjectWrap<Wakeup> {

public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    explicit Wakeup(const Napi::CallbackInfo& info);
    Napi::Value Wake(const Napi::CallbackInfo& info);

private:
    static Napi::FunctionReference constructor;

};

#endif //WAKEUP_H
