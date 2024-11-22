/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
    "\n  mutation AddCardPaymentMandate($input: AddCardPaymentMandateInput!) {\n    unauthenticatedAddCardPaymentMandate(input: $input) {\n      __typename\n      ... on AddCardPaymentMandateSuccessPayload {\n        paymentMandate {\n          id\n          __typename\n        }\n      }\n      ... on Rejection {\n        message\n      }\n    }\n  }\n": types.AddCardPaymentMandateDocument,
    "\n  mutation InitiateCardMerchantPayment(\n    $input: UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkInput!\n  ) {\n    unauthenticatedInitiateMerchantCardPaymentFromPaymentLink(input: $input) {\n      __typename\n      ... on UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkSuccessPayload {\n        redirectUrl\n      }\n      ... on Rejection {\n        message\n      }\n      ... on ValidationRejection {\n        fields {\n          code\n          message\n          path\n        }\n      }\n    }\n  }\n": types.InitiateCardMerchantPaymentDocument,
    "\n  query PaymentArea($paymentLinkId: ID!) {\n    nonEEACountries\n    merchantPaymentLink(id: $paymentLinkId) {\n      ...PaymentPage_MerchantPaymentLink\n      id\n      cancelRedirectUrl\n      merchantProfile {\n        id\n        merchantLogoUrl\n        merchantName\n      }\n      statusInfo {\n        status\n      }\n      redirectUrl\n    }\n  }\n": types.PaymentAreaDocument,
    "\n  fragment SddPayment_MerchantPaymentLink on MerchantPaymentLink {\n    id\n    customer {\n      iban\n      name\n    }\n    billingAddress {\n      addressLine1\n      city\n      postalCode\n    }\n    merchantProfile {\n      merchantName\n    }\n  }\n": types.SddPayment_MerchantPaymentLinkFragmentDoc,
    "\n  mutation AddSepaDirectDebitPaymentMandateFromPaymentLink(\n    $input: AddSepaDirectDebitPaymentMandateFromPaymentLinkInput!\n  ) {\n    addSepaDirectDebitPaymentMandateFromPaymentLink(input: $input) {\n      __typename\n      ... on AddSepaDirectDebitPaymentMandateFromPaymentLinkSuccessPayload {\n        paymentMandate {\n          mandateDocumentUrl\n          id\n        }\n      }\n      ... on ValidationRejection {\n        fields {\n          path\n          message\n        }\n      }\n    }\n  }\n": types.AddSepaDirectDebitPaymentMandateFromPaymentLinkDocument,
    "\n  mutation InitiateMerchantSddPaymentCollectionFromPaymentLink(\n    $input: UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkInput!\n  ) {\n    unauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLink(input: $input) {\n      __typename\n      ... on ForbiddenRejection {\n        message\n      }\n      ... on InternalErrorRejection {\n        message\n      }\n      ... on ValidationRejection {\n        fields {\n          code\n          message\n          path\n        }\n      }\n    }\n  }\n": types.InitiateMerchantSddPaymentCollectionFromPaymentLinkDocument,
    "\n  fragment PaymentPage_MerchantPaymentLink on MerchantPaymentLink {\n    id\n    merchantProfile {\n      accentColor\n    }\n    label\n    amount {\n      value\n      currency\n    }\n    paymentMethods {\n      type\n      id\n    }\n    ...SddPayment_MerchantPaymentLink\n  }\n": types.PaymentPage_MerchantPaymentLinkFragmentDoc,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddCardPaymentMandate($input: AddCardPaymentMandateInput!) {\n    unauthenticatedAddCardPaymentMandate(input: $input) {\n      __typename\n      ... on AddCardPaymentMandateSuccessPayload {\n        paymentMandate {\n          id\n          __typename\n        }\n      }\n      ... on Rejection {\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddCardPaymentMandate($input: AddCardPaymentMandateInput!) {\n    unauthenticatedAddCardPaymentMandate(input: $input) {\n      __typename\n      ... on AddCardPaymentMandateSuccessPayload {\n        paymentMandate {\n          id\n          __typename\n        }\n      }\n      ... on Rejection {\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InitiateCardMerchantPayment(\n    $input: UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkInput!\n  ) {\n    unauthenticatedInitiateMerchantCardPaymentFromPaymentLink(input: $input) {\n      __typename\n      ... on UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkSuccessPayload {\n        redirectUrl\n      }\n      ... on Rejection {\n        message\n      }\n      ... on ValidationRejection {\n        fields {\n          code\n          message\n          path\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation InitiateCardMerchantPayment(\n    $input: UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkInput!\n  ) {\n    unauthenticatedInitiateMerchantCardPaymentFromPaymentLink(input: $input) {\n      __typename\n      ... on UnauthenticatedInitiateMerchantCardPaymentFromPaymentLinkSuccessPayload {\n        redirectUrl\n      }\n      ... on Rejection {\n        message\n      }\n      ... on ValidationRejection {\n        fields {\n          code\n          message\n          path\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PaymentArea($paymentLinkId: ID!) {\n    nonEEACountries\n    merchantPaymentLink(id: $paymentLinkId) {\n      ...PaymentPage_MerchantPaymentLink\n      id\n      cancelRedirectUrl\n      merchantProfile {\n        id\n        merchantLogoUrl\n        merchantName\n      }\n      statusInfo {\n        status\n      }\n      redirectUrl\n    }\n  }\n"): (typeof documents)["\n  query PaymentArea($paymentLinkId: ID!) {\n    nonEEACountries\n    merchantPaymentLink(id: $paymentLinkId) {\n      ...PaymentPage_MerchantPaymentLink\n      id\n      cancelRedirectUrl\n      merchantProfile {\n        id\n        merchantLogoUrl\n        merchantName\n      }\n      statusInfo {\n        status\n      }\n      redirectUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SddPayment_MerchantPaymentLink on MerchantPaymentLink {\n    id\n    customer {\n      iban\n      name\n    }\n    billingAddress {\n      addressLine1\n      city\n      postalCode\n    }\n    merchantProfile {\n      merchantName\n    }\n  }\n"): (typeof documents)["\n  fragment SddPayment_MerchantPaymentLink on MerchantPaymentLink {\n    id\n    customer {\n      iban\n      name\n    }\n    billingAddress {\n      addressLine1\n      city\n      postalCode\n    }\n    merchantProfile {\n      merchantName\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddSepaDirectDebitPaymentMandateFromPaymentLink(\n    $input: AddSepaDirectDebitPaymentMandateFromPaymentLinkInput!\n  ) {\n    addSepaDirectDebitPaymentMandateFromPaymentLink(input: $input) {\n      __typename\n      ... on AddSepaDirectDebitPaymentMandateFromPaymentLinkSuccessPayload {\n        paymentMandate {\n          mandateDocumentUrl\n          id\n        }\n      }\n      ... on ValidationRejection {\n        fields {\n          path\n          message\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddSepaDirectDebitPaymentMandateFromPaymentLink(\n    $input: AddSepaDirectDebitPaymentMandateFromPaymentLinkInput!\n  ) {\n    addSepaDirectDebitPaymentMandateFromPaymentLink(input: $input) {\n      __typename\n      ... on AddSepaDirectDebitPaymentMandateFromPaymentLinkSuccessPayload {\n        paymentMandate {\n          mandateDocumentUrl\n          id\n        }\n      }\n      ... on ValidationRejection {\n        fields {\n          path\n          message\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation InitiateMerchantSddPaymentCollectionFromPaymentLink(\n    $input: UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkInput!\n  ) {\n    unauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLink(input: $input) {\n      __typename\n      ... on ForbiddenRejection {\n        message\n      }\n      ... on InternalErrorRejection {\n        message\n      }\n      ... on ValidationRejection {\n        fields {\n          code\n          message\n          path\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation InitiateMerchantSddPaymentCollectionFromPaymentLink(\n    $input: UnauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLinkInput!\n  ) {\n    unauthenticatedInitiateMerchantSddPaymentCollectionFromPaymentLink(input: $input) {\n      __typename\n      ... on ForbiddenRejection {\n        message\n      }\n      ... on InternalErrorRejection {\n        message\n      }\n      ... on ValidationRejection {\n        fields {\n          code\n          message\n          path\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PaymentPage_MerchantPaymentLink on MerchantPaymentLink {\n    id\n    merchantProfile {\n      accentColor\n    }\n    label\n    amount {\n      value\n      currency\n    }\n    paymentMethods {\n      type\n      id\n    }\n    ...SddPayment_MerchantPaymentLink\n  }\n"): (typeof documents)["\n  fragment PaymentPage_MerchantPaymentLink on MerchantPaymentLink {\n    id\n    merchantProfile {\n      accentColor\n    }\n    label\n    amount {\n      value\n      currency\n    }\n    paymentMethods {\n      type\n      id\n    }\n    ...SddPayment_MerchantPaymentLink\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;