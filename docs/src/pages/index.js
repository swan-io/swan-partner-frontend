import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import * as React from "react";
import HomepageFeatures from "../components/HomepageFeatures";
import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={"hero hero--primary " + styles.hero}>
      <img src={"./img/logo.svg"} alt="" className={styles.logo} width={150} height={150} />
      <div className="container">
        <h1 className={styles.heroTitle}>Banking Frontend</h1>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div>
          <Link className="button button--lg" to="/getting-started">
            Get started
          </Link>
        </div>
      </div>
      <div className={styles.featuredImage}>
        <img
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            objectFit: "contain",
            objectPosition: "50% 50%",
          }}
          widht={2920}
          height={1874}
          loading="lazy"
          src="/swan-partner-frontend/img/banking.png"
          alt="Screenshot of Swan's banking interface"
        />
      </div>
    </header>
  );
}

const Block = ({ children, reversed = false, title, description }) => {
  return (
    <div className={reversed ? styles.blockReversed : styles.block}>
      <div className={styles.blockSide}>{children}</div>
      <div className={styles.blockSide}>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
};

const Home = () => {
  const { siteConfig } = useDocusaurusContext();
  const videoContainer = React.useRef(null);

  React.useEffect(() => {
    const element = videoContainer.current;
    if (element) {
      const intersectionObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const video = element.querySelector("video");
              if (video) {
                video.play();
              }
            }
          });
        },
        {
          rootMargin: "100px",
        },
      );
      intersectionObserver.observe(element);
      return () => intersectionObserver.unobserve(element);
    }
  }, []);

  return (
    <Layout
      title={`Swan Banking Frontend: ${siteConfig.tagline}`}
      description="Onboarding & Banking clients for Swan"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
};

export default Home;
