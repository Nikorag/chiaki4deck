#ifndef REGISTER_H
#define REGISTER_H
#include <napi.h>

class Register : public Napi::ObjectWrap<Register> {

    public:
        static Napi::Object Init(Napi::Env env, Napi::Object exports);
        Register(const Napi::CallbackInfo& info);
        Napi::Value CreatePayload(const Napi::CallbackInfo& info);
        Napi::Value CreateHeader(const Napi::CallbackInfo& info);
        Napi::Value Search(const Napi::CallbackInfo& info);

    private:
        static Napi::FunctionReference constructor;

};

#endif //REGISTER_H
