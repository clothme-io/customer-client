export function IphoneFrame({ src, alt = "", className = "" }) {
  return (
    <div className={`iphone-frame ${className}`.trim()}>
      <div className="iphone-frame-bezel">
        <div className="iphone-frame-island" aria-hidden="true" />
        <div className="iphone-frame-screen">
          <img src={src} alt={alt} />
        </div>
        <div className="iphone-frame-home" aria-hidden="true" />
      </div>
    </div>
  );
}
