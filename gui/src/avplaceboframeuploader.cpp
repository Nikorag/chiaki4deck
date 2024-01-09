#include <avplaceboframeuploader.h>
#include <avplacebowidget.h>
#include <streamsession.h>

AVPlaceboFrameUploader::AVPlaceboFrameUploader(StreamSession *session, AVPlaceboWidget *widget)
    : QObject(nullptr),
    session(session),
    widget(widget)
{
    connect(session, &StreamSession::FfmpegFrameAvailable, this, &AVPlaceboFrameUploader::UpdateFrameFromDecoder);
}

void AVPlaceboFrameUploader::UpdateFrameFromDecoder()
{
    ChiakiFfmpegDecoder *decoder = session->GetFfmpegDecoder();
    if(!decoder)
    {
        CHIAKI_LOGE(session->GetChiakiLog(), "Session has no ffmpeg decoder");
        return;
    }

    int32_t frames_lost;
    AVFrame *next_frame = chiaki_ffmpeg_decoder_pull_frame(decoder, /*hw_download*/ false, &frames_lost);
    if(!next_frame)
        return;

    widget->QueueFrame(next_frame);
}
