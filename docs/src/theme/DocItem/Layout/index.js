import { useWindowSize } from "@docusaurus/theme-common";
import { useDoc } from "@docusaurus/theme-common/internal";
import DocBreadcrumbs from "@theme/DocBreadcrumbs";
import DocItemContent from "@theme/DocItem/Content";
import DocItemFooter from "@theme/DocItem/Footer";
import DocItemPaginator from "@theme/DocItem/Paginator";
import DocItemTOCDesktop from "@theme/DocItem/TOC/Desktop";
import DocItemTOCMobile from "@theme/DocItem/TOC/Mobile";
import DocVersionBadge from "@theme/DocVersionBadge";
import DocVersionBanner from "@theme/DocVersionBanner";
import clsx from "clsx";
import styles from "./styles.module.css";
/**
 * Decide if the toc should be rendered, on mobile or desktop viewports
 */
function useDocTOC() {
  const { frontMatter, toc } = useDoc();
  const windowSize = useWindowSize();
  const hidden = frontMatter.hide_table_of_contents;
  const canRender = !hidden && toc.length > 0;
  const mobile = canRender ? <DocItemTOCMobile /> : undefined;
  const desktop =
    canRender && (windowSize === "desktop" || windowSize === "ssr") ? (
      <DocItemTOCDesktop />
    ) : undefined;
  return {
    hidden,
    mobile,
    desktop,
  };
}
export default function DocItemLayout({ children }) {
  const docTOC = useDocTOC();
  return (
    <div className="row">
      <div className={clsx("col", !docTOC.hidden && styles.docItemCol)}>
        <DocVersionBanner />
        <div className={styles.docItemContainer}>
          <article>
            <DocBreadcrumbs />
            <DocVersionBadge />
            {docTOC.mobile}
            <DocItemContent>{children}</DocItemContent>
            <DocItemFooter />
          </article>
          <DocItemPaginator />
          <div style={{ textAlign: "center", padding: "40px 10px 10px" }}>
            🚀 Any questions? Help improve this project and the docs by opening a{" "}
            <a target="_blank" href="https://github.com/swan-io/swan-partner-frontend/discussions">
              GitHub discussion
            </a>
            .
          </div>
        </div>
      </div>
      {docTOC.desktop && <div className="col col--3">{docTOC.desktop}</div>}
    </div>
  );
}
