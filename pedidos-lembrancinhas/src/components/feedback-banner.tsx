type FeedbackBannerProps = {
  message: string;
};

export function FeedbackBanner({ message }: FeedbackBannerProps) {
  return (
    <div className="feedback-banner" role="status">
      {message}
    </div>
  );
}
