#include "register.h"

#include <netdb.h>
#include <QString>

#include "chiaki/regist.h"
#include "chiaki/random.h"
#include "chiaki/time.h"

static const char *const request_head_fmt =
    "POST %s HTTP/1.1\r\n HTTP/1.1\r\n"
    "HOST: 10.0.2.15\r\n" // random lol
    "User-Agent: remoteplay Windows\r\n"
    "Connection: close\r\n"
    "Content-Length: %llu\r\n";

static const char *request_path_ps5 = "/sie/ps5/rp/sess/rgst";
static const char *request_path_ps4 = "/sie/ps4/rp/sess/rgst";
static const char *request_path_ps4_pre10 = "/sce/rp/regist";

static const char *const request_rp_version_fmt = "RP-Version: %s\r\n";

static const char *const request_tail = "\r\n";

static const char *request_path(ChiakiTarget target)
{
    switch(target)
    {
        case CHIAKI_TARGET_PS5_UNKNOWN:
        case CHIAKI_TARGET_PS5_1:
            return request_path_ps5;
        case CHIAKI_TARGET_PS4_8:
        case CHIAKI_TARGET_PS4_9:
            return request_path_ps4_pre10;
        default:
            return request_path_ps4;
    }
}

Napi::FunctionReference Register::constructor;
static int request_header_format(char *buf, size_t buf_size, size_t payload_size, ChiakiTarget target);
static ChiakiErrorCode regist_search(ChiakiRegist *regist, struct addrinfo *addrinfos, struct sockaddr *recv_addr, socklen_t *recv_addr_size);
static chiaki_socket_t regist_search_connect(ChiakiRegist *regist, struct addrinfo *addrinfos, struct sockaddr *send_addr, socklen_t *send_addr_len);
static ChiakiErrorCode set_port(struct sockaddr *sa, uint16_t port);
static const char *sockaddr_str(struct sockaddr *addr, char *addr_buf, size_t addr_buf_size);
static chiaki_socket_t regist_request_connect(ChiakiRegist *regist, const struct sockaddr *addr, size_t addr_len);

Napi::Object Register::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "Register",{
        InstanceMethod("createPayload", &Register::CreatePayload),
        InstanceMethod("createHeader", &Register::CreateHeader),
    	InstanceMethod("startSearch", &Register::Search),
    	InstanceMethod("connect", &Register::Connect)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Register", func);
    return exports;
}

Register::Register(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Register>(info) {

}

Napi::Value Register::CreatePayload(const Napi::CallbackInfo& info) {
    ChiakiRegistInfo registInfo = {};
    int target = info[0].As<Napi::Number>();
    registInfo.target = static_cast<ChiakiTarget>(target);
    QString psn_online_id = QString::fromStdString(info[1].As<Napi::String>());
	if (psn_online_id != "") {
		registInfo.psn_online_id = psn_online_id.trimmed().toUtf8();
	}
    QString psn_account_id = QString::fromStdString(info[2].As<Napi::String>());
    QString account_id_b64 = psn_account_id.trimmed();
    QByteArray account_id = QByteArray::fromBase64(account_id_b64.toUtf8());
    registInfo.psn_online_id = nullptr;
    memcpy(registInfo.psn_account_id, account_id.constData(), 8);
    QString pin = QString::fromStdString(info[3].As<Napi::String>());
    registInfo.pin = (uint32_t)pin.toULong();

    ChiakiRPCrypt crypt;
    uint8_t ambassador[CHIAKI_RPCRYPT_KEY_SIZE];
    ChiakiErrorCode err = chiaki_random_bytes_crypt(ambassador, sizeof(ambassador));

    uint8_t payload[0x400];
    size_t payload_size = sizeof(payload);
    chiaki_regist_request_payload_format(registInfo.target, ambassador, payload, &payload_size, &crypt, registInfo.psn_online_id, registInfo.psn_account_id, registInfo.pin);
    return Napi::ArrayBuffer::New(info.Env(), payload, payload_size);
}

Napi::Value Register::CreateHeader(const Napi::CallbackInfo& info) {
    ChiakiRegistInfo registInfo = {};
    int target = info[0].As<Napi::Number>();
    registInfo.target = static_cast<ChiakiTarget>(target);

    int payload_size_in = info[1].As<Napi::Number>();
    size_t payload_size = static_cast<size_t>(payload_size_in);


    char request_header[0x100];
    int request_header_size = request_header_format(request_header, sizeof(request_header), payload_size, registInfo.target);
    return Napi::String::From(info.Env(), request_header);
}

Napi::Value Register::Search(const Napi::CallbackInfo& info) {
	ChiakiRegist regist;
	ChiakiRegistInfo registInfo = {};
	int target = info[0].As<Napi::Number>();
	registInfo.target = static_cast<ChiakiTarget>(target);
	QString host = QString::fromStdString(info[1].As<Napi::String>());
	registInfo.host = host.toStdString().c_str();
	regist.info = registInfo;

	struct addrinfo *addrinfos;
	getaddrinfo(registInfo.host, nullptr, nullptr, &addrinfos);

	struct sockaddr recv_addr = { 0 };
	socklen_t recv_addr_size;
	recv_addr_size = sizeof(recv_addr);
	regist_search(&regist, addrinfos, &recv_addr, &recv_addr_size);
	chiaki_stop_pipe_sleep(&regist.stop_pipe, 100);

	char addr[64];
	const char *addr_str = sockaddr_str(&recv_addr, addr, sizeof(addr));
	const struct sockaddr_in *addr_in = reinterpret_cast<const struct sockaddr_in*>(addr);
	int port = ntohs(addr_in->sin_port);
	Napi::Object response = Napi::Object::New(info.Env());
	response.Set("address", addr_str);
	response.Set("port", port);

	return response;
}

Napi::Value Register::Connect(const Napi::CallbackInfo& info) {
	printf("Connecting to Host\n");
	ChiakiRegist regist;
	ChiakiRegistInfo registInfo = {};
	int target = info[0].As<Napi::Number>();
	registInfo.target = static_cast<ChiakiTarget>(target);
	QString host = QString::fromStdString(info[1].As<Napi::String>());
	QByteArray hostByteArray = host.toUtf8();
	registInfo.host = strdup(hostByteArray.constData());
	regist.info = registInfo;

	QString psn_online_id = QString::fromStdString(info[2].As<Napi::String>());
	if (psn_online_id != "") {
		registInfo.psn_online_id = psn_online_id.trimmed().toUtf8();
	}
	QString psn_account_id = QString::fromStdString(info[3].As<Napi::String>());
	QString account_id_b64 = psn_account_id.trimmed();
	QByteArray account_id = QByteArray::fromBase64(account_id_b64.toUtf8());
	registInfo.psn_online_id = nullptr;
	memcpy(registInfo.psn_account_id, account_id.constData(), 8);
	QString pin = QString::fromStdString(info[4].As<Napi::String>());
	registInfo.pin = (uint32_t)pin.toULong();

	ChiakiRPCrypt crypt;
	uint8_t ambassador[CHIAKI_RPCRYPT_KEY_SIZE];
	ChiakiErrorCode err = chiaki_random_bytes_crypt(ambassador, sizeof(ambassador));

	uint8_t payload[0x400];
	size_t payload_size = sizeof(payload);
	chiaki_regist_request_payload_format(registInfo.target, ambassador, payload, &payload_size, &crypt, registInfo.psn_online_id, registInfo.psn_account_id, registInfo.pin);

	struct sockaddr_in serverAddress;
	memset(&serverAddress, 0, sizeof(serverAddress));

	serverAddress.sin_family = AF_INET;
	serverAddress.sin_port = htons(9295);
	inet_pton(AF_INET, strdup(hostByteArray.constData()), &serverAddress.sin_addr);

	socklen_t addr_size;
	addr_size = sizeof(serverAddress);

	char request_header[0x100];
	int request_header_size = request_header_format(request_header, sizeof(request_header), payload_size, registInfo.target);

	chiaki_socket_t sock = regist_request_connect(&regist, reinterpret_cast<const sockaddr*>(&serverAddress), addr_size);
	printf("Got Socket, sending header %s\n", request_header);
	send(sock, request_header, request_header_size, 0);

	printf("[ ");
	for (size_t i = 0; i < payload_size; ++i) {
		printf("%u", payload[i]);  // Assuming you want to print decimal values
		if (i < payload_size - 1) {
			printf(", ");
		}
	}
	printf(" ]\n");

	send(sock, payload, payload_size, 0);

	chiaki_stop_pipe_init(&regist.stop_pipe);

	ChiakiRegisteredHost registered_host;
	err = regist_recv_response(&regist, &registered_host, sock, &crypt);

	Napi::Object responseObject = Napi::Object::New(info.Env());
	responseObject.Set("server_nickname", registered_host.server_nickname);
	responseObject.Set("regist_key", registered_host.server_nickname);

	return responseObject;
}

static chiaki_socket_t regist_request_connect(ChiakiRegist *regist, const struct sockaddr *addr, size_t addr_len)
{
	chiaki_socket_t sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
	if(CHIAKI_SOCKET_IS_INVALID(sock))
	{
		return CHIAKI_INVALID_SOCKET;
	}

	int r = connect(sock, addr, addr_len);
	if(r < 0)
	{
		int errsv = errno;
#ifdef _WIN32
		CHIAKI_LOGE(regist->log, "Regist connect failed: %u", WSAGetLastError());
#else
		CHIAKI_LOGE(regist->log, "Regist connect failed: %s", strerror(errsv));
#endif
		CHIAKI_SOCKET_CLOSE(sock);
		sock = CHIAKI_INVALID_SOCKET;
	}

	return sock;
}

static int request_header_format(char *buf, size_t buf_size, size_t payload_size, ChiakiTarget target)
{
    int cur = snprintf(buf, buf_size, request_head_fmt, request_path(target),
            (unsigned long long)payload_size);
    if(cur < 0 || cur >= payload_size)
        return -1;
    if(target >= CHIAKI_TARGET_PS4_9)
    {
        const char *rp_version_str = chiaki_rp_version_string(target);
        size_t s = buf_size - cur;
        int r = snprintf(buf + cur, s, request_rp_version_fmt, rp_version_str);
        if(r < 0 || r >= s)
            return -1;
        cur += r;
    }
    size_t tail_size = strlen(request_tail) + 1;
    if(cur + tail_size > payload_size)
        return -1;
    memcpy(buf + cur, request_tail, tail_size);
    cur += (int)tail_size - 1;
    return cur;
}

static ChiakiErrorCode regist_search(ChiakiRegist *regist, struct addrinfo *addrinfos, struct sockaddr *recv_addr, socklen_t *recv_addr_size)
{
    printf("Regist starting search\n");
	struct sockaddr send_addr;
	socklen_t send_addr_len = sizeof(send_addr);
	chiaki_socket_t sock = regist_search_connect(regist, addrinfos, &send_addr, &send_addr_len);
	if(CHIAKI_SOCKET_IS_INVALID(sock))
	{
		printf("Regist eventually failed to connect for search\n");
		return CHIAKI_ERR_NETWORK;
	}

	ChiakiErrorCode err = CHIAKI_ERR_SUCCESS;

	const char *src = chiaki_target_is_ps5(regist->info.target) ? "SRC3" : "SRC2";
	const char *res = chiaki_target_is_ps5(regist->info.target) ? "RES3" : "RES2";
	size_t res_size = strlen(res);

	printf("Regist sending search packet\n");
	int r;
	// if(regist->info.broadcast)
	// 	r = sendto_broadcast(regist->log, sock, src, strlen(src) + 1, 0, &send_addr, send_addr_len);
	// else
		r = send(sock, src, strlen(src) + 1, 0);
	if(r < 0)
	{
		printf("Regist failed to send search: %s\n", strerror(errno));
		err = CHIAKI_ERR_NETWORK;
		CHIAKI_SOCKET_CLOSE(sock);
		return err;
	}

	uint64_t timeout_abs_ms = chiaki_time_now_monotonic_ms() + 3000;
	chiaki_stop_pipe_init(&regist->stop_pipe);
	while(true)
	{
		uint64_t now_ms = chiaki_time_now_monotonic_ms();
		if(now_ms > timeout_abs_ms)
			err = CHIAKI_ERR_TIMEOUT;
		else
			err = chiaki_stop_pipe_select_single(&regist->stop_pipe, sock, false, timeout_abs_ms - now_ms);
		if(err != CHIAKI_ERR_SUCCESS)
		{
			if(err == CHIAKI_ERR_TIMEOUT)
				printf("Regist timed out waiting for search response\n");
			break;
		}

		uint8_t buf[0x100];
		int n = recvfrom(sock, buf, sizeof(buf) - 1, 0, recv_addr, recv_addr_size);
		if(n <= 0)
		{
			if(n < 0)
				printf("Regist failed to receive search response: %s\n", strerror(errno));
			else
				printf("Regist failed to receive search response\n");
			err = CHIAKI_ERR_NETWORK;
			CHIAKI_SOCKET_CLOSE(sock);
			return err;
		}

		printf("Regist received packet: %d >= %d\n", n, res_size);
		chiaki_log_hexdump(regist->log, CHIAKI_LOG_VERBOSE, buf, n);

		if(n >= res_size && !memcmp(buf, res, res_size))
		{
			char addr[64];
			const char *addr_str = sockaddr_str(recv_addr, addr, sizeof(addr));
			printf("Regist received search response from %s\n", addr_str ? addr_str : "");
			break;
		}
	}

	CHIAKI_SOCKET_CLOSE(sock);
	return err;
}

static chiaki_socket_t regist_search_connect(ChiakiRegist *regist, struct addrinfo *addrinfos, struct sockaddr *send_addr, socklen_t *send_addr_len)
{
	chiaki_socket_t sock = CHIAKI_INVALID_SOCKET;
	for(struct addrinfo *ai=addrinfos; ai; ai=ai->ai_next)
	{
		//if(ai->ai_protocol != IPPROTO_UDP)
		//	continue;

		if(ai->ai_addr->sa_family != AF_INET) // TODO: support IPv6
			continue;

		if(ai->ai_addrlen > *send_addr_len)
			continue;
		memcpy(send_addr, ai->ai_addr, ai->ai_addrlen);
		*send_addr_len = ai->ai_addrlen;

		set_port(send_addr, htons(9295));

		sock = socket(ai->ai_family, SOCK_DGRAM, IPPROTO_UDP);
		if(CHIAKI_SOCKET_IS_INVALID(sock))
		{
			printf("Regist failed to create socket for search\n\n");
			continue;
		}

		int r = connect(sock, send_addr, *send_addr_len);
		if(r < 0)
		{
#ifdef _WIN32
			printf("Regist connect failed, error %u\n\n", WSAGetLastError());
#else
			int errsv = errno;
			printf("Regist connect failed: %s\n\n", strerror(errsv));
#endif
			goto connect_fail;
		}
		break;

		connect_fail:
				CHIAKI_SOCKET_CLOSE(sock);
		sock = CHIAKI_INVALID_SOCKET;
	}

	return sock;
}

static ChiakiErrorCode set_port(struct sockaddr *sa, uint16_t port)
{
	if(sa->sa_family == AF_INET)
		((struct sockaddr_in *)sa)->sin_port = port;
	else if(sa->sa_family == AF_INET6)
		((struct sockaddr_in6 *)sa)->sin6_port = port;
	else
		return CHIAKI_ERR_INVALID_DATA;
	return CHIAKI_ERR_SUCCESS;
}

static inline const char *sockaddr_str(struct sockaddr *addr, char *addr_buf, size_t addr_buf_size)
{
	void *addr_src;
	switch(addr->sa_family)
	{
		case AF_INET:
			addr_src = &((struct sockaddr_in *)addr)->sin_addr;
		break;
		case AF_INET6:
			addr_src = &((struct sockaddr_in6 *)addr)->sin6_addr;
		break;
		default:
			addr_src = NULL;
		break;
	}
	if(addr_src)
		return inet_ntop(addr->sa_family, addr_src, addr_buf, addr_buf_size);
	return NULL;
}