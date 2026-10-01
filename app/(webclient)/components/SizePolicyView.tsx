import { FitProfileGate } from "./FitProfileGate";
import Link from "next/link";
import { AccountSubHeader } from "./AccountSubHeader";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function SizePolicyView() {
  return (
    <section>
      <FitProfileGate />
      <AccountSubHeader title="Our Promise" backHref="/account" />
      <div className={styles.sizeCopy}>
        <p className={shell.muted}>
          Before we generate your fashion sizes, we want you to know how we
          handle your data.
        </p>
        <h2>How we use your photos</h2>
        <p>
          Your photos are sent to our measurement service to calculate your
          sizes. This browser keeps a temporary copy while you complete capture
          and removes it after generation is accepted.
        </p>
        <h2>Secure fashion sizes</h2>
        <p>
          Your fashion sizes are stored securely and only used to provide you
          with accurate size recommendations.
        </p>
        <h2>Your privacy is our priority</h2>
        <p>
          We are committed to protecting your privacy and handling your data
          securely. Read our <Link href="/privacy-policy">privacy policy</Link>{" "}
          for details about processing and retention.
        </p>
        <h2>Tips for taking the best photos</h2>
        <ul>
          <li>
            Images should be sharp, not blurry. Use good lighting, and avoid
            harsh shadows.
          </li>
          <li>
            Wear tight or body-fitting clothing. Avoid baggy jackets, coats,
            dresses, or heavy layers.
          </li>
          <li>Avoid major occlusion from furniture, hair, hands, or props.</li>
          <li>
            Have the same person, and preferably the same outfit, in both
            photos.
          </li>
        </ul>
        <p className={shell.muted}>
          By continuing, you acknowledge that you have read and understood our
          privacy policy regarding size measurements.
        </p>
        <Link
          className={shell.button}
          href="/account/size/age-height"
          style={{ width: "100%", textAlign: "center" }}
        >
          Add Sizes Automatically
        </Link>
        <Link
          className={`${shell.button} ${shell.ghostButton}`}
          href="/account/size/manual"
          style={{ width: "100%", textAlign: "center", marginTop: 10 }}
        >
          Add Sizes Manually
        </Link>
      </div>
    </section>
  );
}
