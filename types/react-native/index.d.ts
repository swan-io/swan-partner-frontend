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

  export type WebRole =
    | ReactNative.Role
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
    | "heading" // <h{1,6} />
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
    | "gridcell"
    | "listbox"
    | "menuitemcheckbox"
    | "menuitemradio"
    | "textbox";

  export interface WebAccessibilityProps {
    /**
     * Additional accessibility props
     */
    tabIndex?: 0 | -1;

    /**
     * Aria props (additional, minus existants)
     * @see https://necolas.github.io/react-native-web/docs/accessibility
     * @see https://reactnative.dev/docs/accessibility#aria-valuemax
     */
    "aria-activedescendant"?: string;
    "aria-atomic"?: boolean;
    "aria-autocomplete"?: string;
    "aria-colcount"?: number;
    "aria-colindex"?: number;
    "aria-colspan"?: number;
    "aria-controls"?: string;
    "aria-current"?: boolean | "page" | "step" | "location" | "date" | "time";
    "aria-describedby"?: string;
    "aria-details"?: string;
    "aria-errormessage"?: string;
    "aria-flowto"?: string;
    "aria-haspopup"?: string;
    "aria-invalid"?: boolean;
    "aria-keyshortcuts"?: string;
    "aria-level"?: number;
    "aria-multiline"?: boolean;
    "aria-multiselectable"?: boolean;
    "aria-orientation"?: "horizontal" | "vertical";
    "aria-owns"?: string;
    "aria-placeholder"?: string;
    "aria-posinset"?: number;
    "aria-pressed"?: boolean;
    "aria-readonly"?: boolean;
    "aria-required"?: boolean;
    "aria-roledescription"?: string;
    "aria-rowcount"?: number;
    "aria-rowindex"?: number;
    "aria-rowspan"?: number;
    "aria-setsize"?: number;
    "aria-sort"?: "ascending" | "descending" | "none" | "other";
  }

  export interface ImageProps extends WebAccessibilityProps {
    role?: WebRole;
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
    role?: WebRole;
    onHoverIn?: (event: unknown) => void;
    onHoverOut?: (event: unknown) => void;
  }

  export interface ScrollViewProps extends WebAccessibilityProps {
    role?: WebRole;
  }

  type HrefAttrs = {
    download?: boolean;
    rel?: string;
    target?: "blank" | "parent" | "self" | "top";
  };

  export interface TextProps extends WebAccessibilityProps {
    role?: WebRole;
    href?: string;
    hrefAttrs?: HrefAttrs;
    lang?: string;
  }

  export interface TextInputProps extends WebAccessibilityProps {
    role?: WebRole;
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

    // https://github.com/necolas/react-native-web/blob/0.19.1/packages/react-native-web/src/exports/TextInput/types.js#L32

    enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
    rows?: number;
    readOnly?: boolean;
  }

  export interface TextInputKeyPressEventData {
    keyCode: number;
  }

  export interface ViewProps extends WebAccessibilityProps {
    role?: WebRole;
    onKeyDown?: (event: NativeSyntheticEvent<React.KeyboardEvent>) => void;
    onKeyDownCapture?: (event: NativeSyntheticEvent<React.KeyboardEvent>) => void;
    onKeyUp?: (event: NativeSyntheticEvent<React.KeyboardEvent>) => void;
    onKeyUpCapture?: (event: NativeSyntheticEvent<React.KeyboardEvent>) => void;
  }

  // https://github.com/necolas/react-native-web/blob/0.19.1/packages/react-native-web/src/types/styles.js

  /**
   * Animations and transitions
   */

  type AnimationDirection = "alternate" | "alternate-reverse" | "normal" | "reverse";
  type AnimationFillMode = "none" | "forwards" | "backwards" | "both";
  type AnimationIterationCount = number | "infinite";
  type AnimationKeyframes = Record<string, ImageStyle | TextStyle | ViewStyle>;
  type AnimationPlayState = "paused" | "running";

  export interface AnimationStyles {
    animationDelay?: string;
    animationDirection?: AnimationDirection;
    animationDuration?: string;
    animationFillMode?: AnimationFillMode;
    animationIterationCount?: AnimationIterationCount;
    animationKeyframes?: AnimationKeyframes | AnimationKeyframes[];
    animationPlayState?: AnimationPlayState;
    animationTimingFunction?: string;
    transitionDelay?: string;
    transitionDuration?: string;
    transitionProperty?: string;
    transitionTimingFunction?: string;
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

  export interface TransformsStyle {
    perspective?: number | string;
    perspectiveOrigin?: string;
    transform?: string;
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
    transform?: string;
  }

  export interface TextStyle extends AnimationStyles, InteractionStyles, TransformsStyle {
    display?: DisplayValue;
    fontFeatureSettings?: string;
    textOverflow?: "clip" | "ellipsis";
    textTransform?: "none" | "capitalize" | "uppercase" | "lowercase";
    transform?: string;
    whiteSpace?: "normal" | "nowrap" | "pre" | "pre-line" | "pre-wrap";
    wordBreak?: "normal" | "break-all" | "keep-all";
  }

  export interface ViewStyle extends AnimationStyles, InteractionStyles, TransformsStyle {
    appearance?: "none";
    backgroundImage?: string;
    backgroundRepeat?: string;
    backgroundSize?: string;
    boxShadow?: string;
    display?: DisplayValue;
    position?: PositionValue;
    scrollBehavior?: "auto" | "smooth";
    scrollSnapAlign?: "start" | "end" | "center";
    scrollSnapType?: string;
    transform?: string;
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
    prompt?: string;
    selectedValue?: string;
    style?: StyleProp<TextStyle>;
    testID?: string;
    onValueChange?: (itemValue: any, itemPosition: number) => void;
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
}
