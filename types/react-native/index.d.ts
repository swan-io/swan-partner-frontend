import * as ReactNative from "react-native";

declare module "react-native" {
  export const unstable_createElement: <P>(
    type: React.ElementType,
    props?: P,
  ) => React.ReactElement<P>;

  export namespace AppRegistry {
    function getApplication(string): {
      element: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
      getStyleElement: () => React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    };
  }

  export type WebAccessibilityRole =
    /**
     * Accessibility roles shared with native platform
     * @see @types/react-native
     *
     * adjustable -> <div role="slider" />
     * alert -> <div role="alert" />
     * button -> <div role="button" />
     * checkbox -> <div role="checkbox" />
     * combobox -> <div role="combobox" />
     * header -> <h{aria-level prop value (1,6)} role="heading" />
     * image -> <div role="img" />
     * imagebutton -> <div />
     * keyboardkey -> <div />
     * link -> <a role="link" />
     * list -> <ul role="list" />
     * menu -> <div role="menu" />
     * menubar -> <div role="menubar" />
     * menuitem -> <div role="menuitem" />
     * none -> <div role="presentation" />
     * progressbar -> <div role="progressbar" />
     * radio -> <div role="radio" />
     * radiogroup -> <div role="radiogroup" />
     * scrollbar -> <div role="scrollbar" />
     * search -> <div role="search" />
     * spinbutton -> <div role="spinbutton" />
     * summary -> <section role="region" />
     * switch -> <div role="switch" />
     * tab -> <div role="tab" />
     * tabbar -> <div role="tabbar" />
     * tablist -> <div role="tablist" />
     * text -> <div />
     * timer -> <div role="timer" />
     * togglebutton -> <div role="togglebutton" />
     * toolbar -> <div role="toolbar" />
     */
    | ReactNative.AccessibilityRole
    /**
     * Accessibility roles mapped to components
     * @see https://github.com/necolas/react-native-web/blob/0.19.1/packages/react-native-web/src/modules/AccessibilityUtil/propsToAccessibilityComponent.js
     */
    | "article" // <article />
    | "banner" // <header />
    | "blockquote" // <blockquote />
    | "button" // <button />
    | "code" // <code />
    | "complementary" // <aside />
    | "contentinfo" // <footer />
    | "deletion" // <del />
    | "emphasis" // <em />
    | "figure" // <figure />
    | "form" // <form />
    | "insertion" // <ins />
    | "label" // <label />
    | "list" // <ul />
    | "listitem" // <li />
    | "main" // <main />
    | "navigation" // <nav />
    | "paragraph" // <p />
    | "region" // <section />
    | "strong" // <strong />
    /**
     * Accessibility roles mapped to ARIA roles (additional, minus existants)
     * @see https://www.w3.org/TR/wai-aria-1.1/#role_definitions
     */
    | "alertdialog"
    | "application"
    | "cell"
    | "columnheader"
    | "definition"
    | "dialog"
    | "directory"
    | "document"
    | "feed"
    | "grid"
    | "gridcell"
    | "group"
    | "listbox"
    | "log"
    | "marquee"
    | "math"
    | "menuitemcheckbox"
    | "menuitemradio"
    | "note"
    | "option"
    | "row"
    | "rowgroup"
    | "rowheader"
    | "searchbox"
    | "separator"
    | "status"
    | "table"
    | "tabpanel"
    | "term"
    | "textbox"
    | "tooltip"
    | "tree"
    | "treegrid"
    | "treeitem";

  export interface WebAccessibilityProps {
    accessibilityActiveDescendant?: string;
    accessibilityAtomic?: boolean;
    accessibilityAutoComplete?: string;
    accessibilityBusy?: boolean;
    accessibilityChecked?: boolean | "mixed";
    accessibilityColumnCount?: number;
    accessibilityColumnIndex?: number;
    accessibilityColumnSpan?: number;
    accessibilityControls?: string;
    accessibilityCurrent?: boolean | "page" | "step" | "location" | "date" | "time";
    accessibilityDescribedBy?: string;
    accessibilityDetails?: string;
    accessibilityDisabled?: boolean;
    accessibilityErrorMessage?: string;
    accessibilityExpanded?: boolean;
    accessibilityFlowTo?: string;
    accessibilityHasPopup?: string;
    accessibilityHidden?: boolean;
    accessibilityInvalid?: boolean;
    accessibilityKeyShortcuts?: string[];
    accessibilityLabel?: string;
    accessibilityLabelledBy?: string;
    accessibilityLevel?: number;
    accessibilityLiveRegion?: "assertive" | "off" | "polite";
    accessibilityModal?: boolean;
    accessibilityMultiSelectable?: boolean;
    accessibilityMultiline?: boolean;
    accessibilityOrientation?: "horizontal" | "vertical";
    accessibilityOwns?: string;
    accessibilityPlaceholder?: string;
    accessibilityPosInSet?: number;
    accessibilityPressed?: boolean;
    accessibilityReadOnly?: boolean;
    accessibilityRequired?: boolean;
    accessibilityRoleDescription?: string;
    accessibilityRowCount?: number;
    accessibilityRowIndex?: number;
    accessibilityRowSpan?: number;
    accessibilitySelected?: boolean;
    accessibilitySetSize?: number;
    accessibilitySort?: "ascending" | "descending" | "none" | "other";
    accessibilityValueMax?: number;
    accessibilityValueMin?: number;
    accessibilityValueNow?: number;
    accessibilityValueText?: string;
  }

  export interface ImageProps extends WebAccessibilityProps {
    accessibilityRole?: WebAccessibilityRole;
    defaultSource?: ImageSourcePropType | string;
    draggable?: boolean;
    source: ImageSourcePropType | string;
  }

  export interface PressableStateCallbackType {
    readonly focused: boolean;
    readonly hovered: boolean;
    readonly pressed: boolean;
  }

  export interface PressableProps extends WebAccessibilityProps {
    accessibilityRole?: WebAccessibilityRole;
    onHoverIn?: (event: unknown) => void;
    onHoverOut?: (event: unknown) => void;
  }

  export interface ScrollViewProps extends WebAccessibilityProps {
    accessibilityRole?: WebAccessibilityRole;
  }

  type HrefAttrs = {
    download?: boolean;
    rel?: string;
    target?: "blank" | "parent" | "self" | "top";
  };

  export interface TextProps extends WebAccessibilityProps {
    accessibilityRole?: WebAccessibilityRole;
    focusable?: boolean;
    href?: string;
    hrefAttrs?: HrefAttrs;
    lang?: string;
  }

  export interface TextInputProps extends WebAccessibilityProps {
    accessibilityRole?: WebAccessibilityRole;
    lang?: string;
    initialValue?: string;

    // From https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
    autoComplete?:
      | "additional-name"
      | "address-level1"
      | "address-level2"
      | "address-level3"
      | "address-level4"
      | "address-line1"
      | "address-line2"
      | "address-line3"
      | "bday"
      | "bday-day"
      | "bday-month"
      | "bday-year"
      | "cc-additional-name"
      | "cc-csc"
      | "cc-exp"
      | "cc-exp-month"
      | "cc-exp-year"
      | "cc-family-name"
      | "cc-given-name"
      | "cc-name"
      | "cc-number"
      | "cc-type"
      | "country"
      | "country-name"
      | "current-password"
      | "email"
      | "family-name"
      | "given-name"
      | "honorific-prefix"
      | "honorific-suffix"
      | "impp"
      | "language"
      | "name"
      | "new-password"
      | "nickname"
      | "off"
      | "on"
      | "one-time-code"
      | "organization"
      | "organization-title"
      | "postal-code"
      | "sex"
      | "street-address"
      | "tel"
      | "tel-area-code"
      | "tel-country-code"
      | "tel-extension"
      | "tel-local"
      | "tel-national"
      | "transaction-amount"
      | "transaction-currency"
      | "url"
      | "username";
  }

  export interface TextInputKeyPressEventData {
    keyCode: number;
  }

  export interface ViewProps extends WebAccessibilityProps {
    accessibilityRole?: WebAccessibilityRole;
    onKeyDown?: (event: NativeSyntheticEvent<React.KeyboardEvent>) => void;
    onKeyDownCapture?: (event: NativeSyntheticEvent<React.KeyboardEvent>) => void;
    onKeyUp?: (event: NativeSyntheticEvent<React.KeyboardEvent>) => void;
    onKeyUpCapture?: (event: NativeSyntheticEvent<React.KeyboardEvent>) => void;
  }

  // https://github.com/necolas/react-native-web/blob/0.19.1/packages/react-native-web/src/types/styles.js

  type NumberOrString = number | string;

  /**
   * Animations and transitions
   */

  type AnimationDirection = "alternate" | "alternate-reverse" | "normal" | "reverse";
  type AnimationFillMode = "none" | "forwards" | "backwards" | "both";
  type AnimationIterationCount = number | "infinite";
  type AnimationKeyframes = Record<string, ImageStyle | TextStyle | ViewStyle>;
  type AnimationPlayState = "paused" | "running";

  export interface AnimationStyles {
    animationDelay?: string | string[];
    animationDirection?: AnimationDirection | AnimationDirection[];
    animationDuration?: string | string[];
    animationFillMode?: AnimationFillMode | AnimationFillMode[];
    animationIterationCount?: AnimationIterationCount | AnimationIterationCount[];
    animationKeyframes?: AnimationKeyframes | AnimationKeyframes[];
    animationPlayState?: AnimationPlayState | AnimationPlayState[];
    animationTimingFunction?: string | string[];
    transitionDelay?: string | string[];
    transitionDuration?: string | string[];
    transitionProperty?: string | string[];
    transitionTimingFunction?: string | string[];
  }

  /**
   * Interactions
   */

  type CursorValue =
    | "alias"
    | "all-scroll"
    | "auto"
    | "cell"
    | "context-menu"
    | "copy"
    | "crosshair"
    | "default"
    | "grab"
    | "grabbing"
    | "help"
    | "inherit"
    | "move"
    | "no-drop"
    | "none"
    | "not-allowed"
    | "pointer"
    | "progress"
    | "text"
    | "vertical-text"
    | "wait"
    | "zoom-in"
    | "zoom-out"
    // resize
    | "col-resize"
    | "e-resize"
    | "ew-resize"
    | "n-resize"
    | "ne-resize"
    | "nesw-resize"
    | "ns-resize"
    | "nw-resize"
    | "nwse-resize"
    | "row-resize"
    | "s-resize"
    | "se-resize"
    | "sw-resize"
    | "w-resize";

  type TouchActionValue =
    | "auto"
    | "inherit"
    | "manipulation"
    | "none"
    | "pan-down"
    | "pan-left"
    | "pan-right"
    | "pan-up"
    | "pan-x"
    | "pan-y"
    | "pinch-zoom";

  type UserSelect = "all" | "auto" | "contain" | "none" | "text";

  export interface InteractionStyles {
    // https://developer.mozilla.org/en-US/docs/Web/CSS/cursor#Formal_syntax
    cursor?: CursorValue;
    // https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action#Formal_syntax
    touchAction?: TouchActionValue;
    // https://developer.mozilla.org/en-US/docs/Web/CSS/user-select#Formal_syntax_2
    userSelect?: UserSelect;
    willChange?: string;
  }

  /**
   * Layout
   */

  type OverflowValue = "auto" | "hidden" | "scroll" | "visible";
  type VisibilityValue = "hidden" | "visible";

  export interface FlexStyle {
    gridAutoColumns?: string;
    gridAutoFlow?: string;
    gridAutoRows?: string;
    gridColumnEnd?: string;
    gridColumnGap?: string;
    gridColumnStart?: string;
    gridRowEnd?: string;
    gridRowGap?: string;
    gridRowStart?: string;
    gridTemplateAreas?: string;
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
  }

  /**
   * Transforms
   */

  type TransformValue = (
    | { perspective: NumberOrString }
    | { rotate: string }
    | { rotateX: string }
    | { rotateY: string }
    | { rotateZ: string }
    | { scale3d: string }
    | { scale: number }
    | { scaleX: number }
    | { scaleY: number }
    | { scaleZ: number }
    | { skewX: string }
    | { skewY: string }
    | { translate3d: string }
    | { translateX: NumberOrString }
    | { translateY: NumberOrString }
    | { translateZ: NumberOrString }
  )[];

  export interface TransformsStyle {
    perspective?: NumberOrString;
    perspectiveOrigin?: string;
    transform?: TransformValue;
    transformOrigin?: string;
    transformStyle?: "flat" | "preserve-3d";
  }

  export interface LayoutRectangle {
    top?: number;
    left?: number;
  }

  type DisplayValue =
    | FlexStyle["display"]
    | "block"
    | "grid"
    | "inline"
    | "inline-block"
    | "inline-flex";

  type PositionValue = FlexStyle["position"] | "fixed" | "static" | "sticky";

  export interface ImageStyle extends AnimationStyles, InteractionStyles, TransformsStyle {
    display?: DisplayValue;
    transform?: TransformValue;
  }

  export interface TextStyle extends AnimationStyles, InteractionStyles, TransformsStyle {
    display?: DisplayValue;
    fontFeatureSettings?: string;
    textOverflow?: "clip" | "ellipsis";
    textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
    transform?: TransformValue;
    whiteSpace?: "normal" | "nowrap" | "pre" | "pre-line" | "pre-wrap";
    wordBreak?: "normal" | "break-all" | "keep-all";
  }

  export interface ViewStyle extends AnimationStyles, InteractionStyles, TransformsStyle {
    appearance?: "none";
    backgroundImage?: string;
    boxShadow?: string;
    display?: DisplayValue;
    position?: PositionValue;
    scrollBehavior?: "auto" | "smooth";
    transform?: TransformValue;
    visibility?: VisibilityValue;
  }

  /**
   * Picker has been extracted from react-native core and will be removed in a future release.
   * It can now be installed and imported from `@react-native-community/picker` instead of 'react-native'.
   * @see https://github.com/react-native-community/react-native-picker
   * @deprecated
   */
  interface PickerProps {
    children?: React.ReactNode;
    enabled?: boolean;
    itemStyle?: StyleProp<TextStyle>;
    mode?: "dialog" | "dropdown";
    onValueChange?: (itemValue: any, itemPosition: number) => void;
    prompt?: string;
    selectedValue?: string;
    style?: StyleProp<TextStyle>;
    testID?: string;
  }

  interface PickerItemProps {
    color?: ColorValue;
    label: string;
    testID?: string;
    value?: string;
  }

  export class Picker extends React.Component<PickerProps> {
    static MODE_DIALOG: string;
    static MODE_DROPDOWN: string;
    static Item: React.ComponentType<PickerItemProps>;
  }

  interface ImageBackgroundProps extends ImagePropsBase {
    imageStyle?: StyleProp<ImageStyle> | undefined;
    style?: StyleProp<ViewStyle> | undefined;
    imageRef?(image: Image): void;
    children?: React.ReactNode;
  }
}
