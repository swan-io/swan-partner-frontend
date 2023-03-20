import * as React from "react";
import styles from "./styles.module.css";

void React;

const FeatureList = [
  {
    title: "Integrate Swan fast",
    svg: (
      <svg
        className={styles.svg}
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 5.25A3.25 3.25 0 0 1 5.25 2h11.5A3.25 3.25 0 0 1 20 5.25v2.76a4.508 4.508 0 0 0-1.5.096V7h-15v9.75c0 .966.784 1.75 1.75 1.75h7.985l-.441.764a2.457 2.457 0 0 0-.28.736H5.25A3.25 3.25 0 0 1 2 16.75V5.25ZM5.25 3.5A1.75 1.75 0 0 0 3.5 5.25v.25h15v-.25a1.75 1.75 0 0 0-1.75-1.75H5.25ZM19.857 9a3.496 3.496 0 0 0-3.356 1.736 3.5 3.5 0 0 0 .184 3.788l-3.025 5.24a1.459 1.459 0 0 0 2.526 1.458l3.03-5.25a3.5 3.5 0 0 0 2.976-5.761l-1.65 2.858a1.167 1.167 0 1 1-2.021-1.167l1.65-2.858A3.478 3.478 0 0 0 19.857 9Zm-9.554.243a.75.75 0 0 1-.046 1.06L7.86 12.5l2.397 2.197a.75.75 0 0 1-1.014 1.106l-3-2.75a.75.75 0 0 1 0-1.106l3-2.75a.75.75 0 0 1 1.06.046Zm2.954 6.56 2.02-1.852a4.495 4.495 0 0 1-.008-2.91l-2.012-1.844a.75.75 0 0 0-1.014 1.106L14.64 12.5l-2.397 2.197a.75.75 0 0 0 1.014 1.106Z"
          fill="#6240B5"
        />
      </svg>
    ),
    description: (
      <>
        Start your Swan integration from the <strong>reference implementation</strong>, and
        increment from a <strong>fully-featured</strong> codebase.
      </>
    ),
  },
  {
    title: "Learn how to build",
    svg: (
      <svg
        className={styles.svg}
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.909 3.7a3.875 3.875 0 0 1 4.182 0l8.064 5.169a.75.75 0 0 1 .005 1.259L19 12.193v5.557a.75.75 0 0 1-.15.45l-.001.001-.001.002-.003.004-.009.01-.015.02a7.428 7.428 0 0 1-1.662 1.401C16.036 20.33 14.339 21 12 21s-4.036-.67-5.159-1.361a7.427 7.427 0 0 1-1.25-.957 5.317 5.317 0 0 1-.316-.33 2.719 2.719 0 0 1-.124-.15L5.15 18.2a.75.75 0 0 1-.15-.45v-5.557l-2-1.307v5.364a.75.75 0 0 1-1.5 0V9.5a.75.75 0 0 1 .358-.64l8.05-5.16Zm4.21 11.681a3.875 3.875 0 0 1-4.238 0L6.5 13.172v4.297a5.934 5.934 0 0 0 1.127.893C8.536 18.92 9.964 19.5 12 19.5s3.464-.58 4.373-1.139a5.935 5.935 0 0 0 1.127-.892v-4.297l-3.38 2.21Zm-.837-10.419c-.781-.5-1.783-.5-2.564 0L3.63 9.506l7.071 4.62c.79.515 1.809.515 2.598 0l7.07-4.62-7.087-4.544Z"
          fill="#6240B5"
        />
      </svg>
    ),
    description: (
      <>
        This repository shows <strong>how Swan's own interfaces are built</strong>, giving you
        insights on how you can build your own.
      </>
    ),
  },
  {
    title: "Customize your UX",
    svg: (
      <svg
        className={styles.svg}
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.75 2a.75.75 0 0 0-.75.75v11.5a2.25 2.25 0 0 0 2.25 2.25H9.5v3a2.5 2.5 0 1 0 5 0v-3h2.25A2.25 2.25 0 0 0 19 14.25V2.75a.75.75 0 0 0-.75-.75H5.75Zm.75 9V3.5h6v1.752a.75.75 0 1 0 1.5 0V3.5h1v2.751a.75.75 0 1 0 1.5 0V3.5h1V11h-11Zm0 3.25V12.5h11v1.75a.75.75 0 0 1-.75.75h-3a.75.75 0 0 0-.75.75v3.75a1 1 0 0 1-2 0v-3.75a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 1-.75-.75Z"
          fill="#6240B5"
        />
      </svg>
    ),
    description: (
      <>
        Swan Partner Front-End lets you <strong>fully customize</strong> your onboarding & banking
        experience.
      </>
    ),
  },
];

function Feature({ svg, title, description }) {
  return (
    <div className="col col--4">
      <div className={styles.svgContainer}>{svg}</div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
