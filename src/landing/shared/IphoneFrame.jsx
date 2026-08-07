export function IphoneFrame({ src, alt = "", className = "", loading = "lazy" }) {
  return (
    <div className={`iphone-frame ${className}`.trim()}>
      <div className="iphone-frame-bezel">
        <div className="iphone-frame-island" aria-hidden="true" />
        <div className="iphone-frame-screen">
          <img src={src} alt={alt} loading={loading} decoding="async" />
        </div>
        <div className="iphone-frame-home" aria-hidden="true" />
      </div>
    </div>
  );
}
