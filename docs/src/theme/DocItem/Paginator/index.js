import { useDoc } from "@docusaurus/theme-common/internal";
import DocPaginator from "@theme/DocPaginator";
/**
 * This extra component is needed, because <DocPaginator> should remain generic.
 * DocPaginator is used in non-docs contexts too: generated-index pages...
 */
export default function DocItemPaginator() {
  const { metadata } = useDoc();
  return <DocPaginator previous={metadata.previous} next={metadata.next} />;
}
