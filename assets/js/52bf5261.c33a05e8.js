"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[549],{3905:function(e,t,n){n.d(t,{Zo:function(){return p},kt:function(){return k}});var a=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,i=function(e,t){if(null==e)return{};var n,a,i={},r=Object.keys(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(a=0;a<r.length;a++)n=r[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=a.createContext({}),c=function(e){var t=a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},p=function(e){var t=c(e.components);return a.createElement(s.Provider,{value:t},e.children)},u="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,i=e.mdxType,r=e.originalType,s=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),u=c(n),d=i,k=u["".concat(s,".").concat(d)]||u[d]||m[d]||r;return n?a.createElement(k,o(o({ref:t},p),{},{components:n})):a.createElement(k,o({ref:t},p))}));function k(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var r=n.length,o=new Array(r);o[0]=d;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[u]="string"==typeof e?e:i,o[1]=l;for(var c=2;c<r;c++)o[c]=n[c];return a.createElement.apply(null,o)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},6109:function(e,t,n){n.r(t),n.d(t,{assets:function(){return s},contentTitle:function(){return o},default:function(){return m},frontMatter:function(){return r},metadata:function(){return l},toc:function(){return c}});var a=n(3117),i=(n(7294),n(3905));const r={},o="Navigation",l={unversionedId:"specs/banking/navigation",id:"specs/banking/navigation",title:"Navigation",description:"Account Membership",source:"@site/docs/specs/banking/navigation.md",sourceDirName:"specs/banking",slug:"/specs/banking/navigation",permalink:"/swan-partner-frontend/specs/banking/navigation",draft:!1,editUrl:"https://github.com/swan-io/swan-partner-frontend/edit/main/docs/docs/specs/banking/navigation.md",tags:[],version:"current",frontMatter:{},sidebar:"specs",previous:{title:"Branding",permalink:"/swan-partner-frontend/specs/banking/branding"},next:{title:"History",permalink:"/swan-partner-frontend/specs/banking/history"}},s={},c=[{value:"Account Membership",id:"account-membership",level:2},{value:"Web Banking settings",id:"web-banking-settings",level:2},{value:"Membership picker",id:"membership-picker",level:3},{value:"Account balance",id:"account-balance",level:3},{value:"Account activation notification",id:"account-activation-notification",level:3},{value:"History",id:"history",level:3},{value:"Account",id:"account",level:3},{value:"Payments",id:"payments",level:3},{value:"Cards",id:"cards",level:3},{value:"Members",id:"members",level:3},{value:"User section",id:"user-section",level:2},{value:"Sign out",id:"sign-out",level:3},{value:"Current user",id:"current-user",level:3}],p={toc:c},u="wrapper";function m(e){let{components:t,...r}=e;return(0,i.kt)(u,(0,a.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"navigation"},"Navigation"),(0,i.kt)("h2",{id:"account-membership"},"Account Membership"),(0,i.kt)("p",null,"An ",(0,i.kt)("strong",{parentName:"p"},"Account Membership")," represents the link between a ",(0,i.kt)("strong",{parentName:"p"},"User")," and an ",(0,i.kt)("strong",{parentName:"p"},"Account"),"."),(0,i.kt)("p",null,"We can query the ",(0,i.kt)("strong",{parentName:"p"},"Account Memberships")," to see what accounts the user can access."),(0,i.kt)("admonition",{type:"info"},(0,i.kt)("p",{parentName:"admonition"},"A user can have an account membership to an account ",(0,i.kt)("strong",{parentName:"p"},"without any permissions")," (sort of a ",(0,i.kt)("em",{parentName:"p"},"blind\xa0membership"),"). In this case the user won\u2019t be able to access the ",(0,i.kt)("inlineCode",{parentName:"p"},"account")," information (not even its ID). The usual use-case for this setup is to order cards for users and only let them access this section.")),(0,i.kt)("h2",{id:"web-banking-settings"},"Web Banking settings"),(0,i.kt)("p",null,"The project holds some ",(0,i.kt)("strong",{parentName:"p"},"feature flags")," for the Web Banking to make the no-code experience more flexible. Note that they\u2019re only front-end flags, and don\u2019t prevent these actions API-wise."),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"canAddNewMembers"),": toggles the \u201cNew\u201d button in the Members section"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"canViewMembers"),": toggles the Members section"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"canViewAccountDetails"),": toggles the Account section"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"canViewAccountStatement"),": toggles the \u201cAccount Statements\u201d button in the History section"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"canOrderVirtualCards"),": toggles the \u201cAdd Card\u201d button on the Cards & Members section"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"canOrderPhysicalCards"),": filters the offered card products in the Card setup"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"canInitiatePaymentsToNewBeneficiaries"),": toggles the \u201cNew\u201d button in the Transfers section"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"canViewPaymentList"),": toggles the Transfers section"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("strong",{parentName:"li"},"canManageVirtualIbans"),": toggles the \u201cNew\u201d button in the Virtual IBANs section")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-graphql"},"fragment WebBanking on ProjectInfo {\n  webBankingSettings {\n    canAddNewMembers\n    canViewMembers\n    canViewAccountDetails\n    canViewAccountStatement\n    canOrderVirtualCards\n    canOrderPhysicalCards\n    canInitiatePaymentsToNewBeneficiaries\n    canViewPaymentList\n    canManageVirtualIbans\n  }\n}\n")),(0,i.kt)("h1",{id:"account-membership-picker"},"Account Membership picker"),(0,i.kt)("blockquote",null,(0,i.kt)("p",{parentName:"blockquote"},"The picker and summary for the membership you\u2019re using.")),(0,i.kt)("h3",{id:"membership-picker"},"Membership picker"),(0,i.kt)("p",null,"Show the currently selected account membership."),(0,i.kt)("admonition",{type:"info"},(0,i.kt)("p",{parentName:"admonition"},(0,i.kt)("inlineCode",{parentName:"p"},"canViewAccount"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"false")," restricts access to the ",(0,i.kt)("inlineCode",{parentName:"p"},"account")," property in the membership.")),(0,i.kt)("p",null,"If the membership has the ",(0,i.kt)("inlineCode",{parentName:"p"},"canViewAccount")," permission:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"membership.account.name")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"membership.account.holder.name"))),(0,i.kt)("p",null,(0,i.kt)("img",{src:n(7585).Z,width:"508",height:"264"})),(0,i.kt)("p",null,"Otherwise:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"membership.email"))),(0,i.kt)("p",null,(0,i.kt)("img",{src:n(4500).Z,width:"516",height:"136"})),(0,i.kt)("p",null,"When open, the picker should list the current user's account memberships."),(0,i.kt)("p",null,(0,i.kt)("img",{src:n(7958).Z,width:"502",height:"618"})),(0,i.kt)("h3",{id:"account-balance"},"Account balance"),(0,i.kt)("p",null,"If the membership has the ",(0,i.kt)("inlineCode",{parentName:"p"},"canViewAccount"),":"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"Show ",(0,i.kt)("inlineCode",{parentName:"li"},"account.balance.available"))),(0,i.kt)("h3",{id:"account-activation-notification"},"Account activation notification"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"If user\u2019s ",(0,i.kt)("inlineCode",{parentName:"li"},"identificationStatus")," is ",(0,i.kt)("inlineCode",{parentName:"li"},"Processing"),", show ",(0,i.kt)("inlineCode",{parentName:"li"},"Pending")),(0,i.kt)("li",{parentName:"ul"},"If user\u2019s ",(0,i.kt)("inlineCode",{parentName:"li"},"identificationStatus")," is ",(0,i.kt)("strong",{parentName:"li"},"different")," from ",(0,i.kt)("inlineCode",{parentName:"li"},"ValidIdentity"),", show ",(0,i.kt)("inlineCode",{parentName:"li"},"Action Required")),(0,i.kt)("li",{parentName:"ul"},"If any of the account holder\u2019s ",(0,i.kt)("inlineCode",{parentName:"li"},"supportingDocumentCollections")," has a ",(0,i.kt)("inlineCode",{parentName:"li"},"documentCollectionStatus")," different from ",(0,i.kt)("inlineCode",{parentName:"li"},"Approved")," and ",(0,i.kt)("inlineCode",{parentName:"li"},"PendingReview"),", show ",(0,i.kt)("inlineCode",{parentName:"li"},"Action Required")),(0,i.kt)("li",{parentName:"ul"},"If any of the account holder\u2019s ",(0,i.kt)("inlineCode",{parentName:"li"},"supportingDocumentCollections")," has a ",(0,i.kt)("inlineCode",{parentName:"li"},"documentCollectionStatus")," with ",(0,i.kt)("inlineCode",{parentName:"li"},"PendingReview"),", show ",(0,i.kt)("inlineCode",{parentName:"li"},"Pending")),(0,i.kt)("li",{parentName:"ul"},"If the account holder is an ",(0,i.kt)("inlineCode",{parentName:"li"},"Individual")," and the account ",(0,i.kt)("inlineCode",{parentName:"li"},"transactions")," total count is 0, show ",(0,i.kt)("inlineCode",{parentName:"li"},"Action Required"))),(0,i.kt)("p",null,(0,i.kt)("img",{src:n(4049).Z,width:"1010",height:"754"})),(0,i.kt)("h1",{id:"inner-account-membership-navigation"},"Inner account membership navigation"),(0,i.kt)("blockquote",null,(0,i.kt)("p",{parentName:"blockquote"},"The navigation for the currently selected account membership")),(0,i.kt)("h3",{id:"history"},"History"),(0,i.kt)("p",null,"Show if ",(0,i.kt)("inlineCode",{parentName:"p"},"membership.canViewAccount")),(0,i.kt)("h3",{id:"account"},"Account"),(0,i.kt)("p",null,"Show if ",(0,i.kt)("inlineCode",{parentName:"p"},"membership.canViewAccount")),(0,i.kt)("h3",{id:"payments"},"Payments"),(0,i.kt)("p",null,"Show if ",(0,i.kt)("strong",{parentName:"p"},"all match"),":"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"either ",(0,i.kt)("inlineCode",{parentName:"li"},"webBankingSettings.canInitiatePaymentsToNewBeneficiaries")," or ",(0,i.kt)("inlineCode",{parentName:"li"},"webBankingSettings.canViewPaymentList")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"membership.canInitiatePayments")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"membership.statusInfo.status")," is ",(0,i.kt)("inlineCode",{parentName:"li"},"Enabled"))),(0,i.kt)("h3",{id:"cards"},"Cards"),(0,i.kt)("p",null,"Show if ",(0,i.kt)("strong",{parentName:"p"},"either match"),":"),(0,i.kt)("ol",null,(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("inlineCode",{parentName:"li"},"membership.canManageMembership")," and ",(0,i.kt)("inlineCode",{parentName:"li"},"webBankingSettings.canOrderVirtualCards")),(0,i.kt)("li",{parentName:"ol"},(0,i.kt)("inlineCode",{parentName:"li"},"membership.cards.totalCount")," > 0")),(0,i.kt)("admonition",{type:"info"},(0,i.kt)("p",{parentName:"admonition"},"The second case is to ",(0,i.kt)("strong",{parentName:"p"},"let users manage their card")," even though they don\u2019t have any permission")),(0,i.kt)("h3",{id:"members"},"Members"),(0,i.kt)("p",null,"Show if ",(0,i.kt)("strong",{parentName:"p"},"all match"),":"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"webBankingSettings.canViewMembers")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"membership.canManageMembership"))),(0,i.kt)("p",null,"Show the red pill if the account has at least one membership with the ",(0,i.kt)("inlineCode",{parentName:"p"},"BindingUserErrorStatus")),(0,i.kt)("h2",{id:"user-section"},"User section"),(0,i.kt)("p",null,(0,i.kt)("img",{src:n(3073).Z,width:"550",height:"240"})),(0,i.kt)("h3",{id:"sign-out"},"Sign out"),(0,i.kt)("p",null,"Show a sign out link"),(0,i.kt)("h3",{id:"current-user"},"Current user"),(0,i.kt)("p",null,"Show the current user:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"Avatar"),(0,i.kt)("li",{parentName:"ul"},"First & last name")),(0,i.kt)("p",null,"If the user\u2019s ",(0,i.kt)("inlineCode",{parentName:"p"},"identificationStatus")," is ",(0,i.kt)("inlineCode",{parentName:"p"},"Unitiated"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"InsufficientDocumentQuality"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"InvalidIdentity")," or ",(0,i.kt)("inlineCode",{parentName:"p"},"ReadyToSign"),", show a an \u201cAction Required\u201d tag ",(0,i.kt)("a",{parentName:"p",href:"./identity-verification-bypass"},"if the project and membership require"),"."))}m.isMDXComponent=!0},4049:function(e,t,n){t.Z=n.p+"assets/images/full-action-required-2339fbe4a6470dde9919e06ffdd71eae.png"},7585:function(e,t,n){t.Z=n.p+"assets/images/full-0625533f150b60f59a46038a6d4e0055.png"},4500:function(e,t,n){t.Z=n.p+"assets/images/no-account-access-da9a8976ba097066434ff369a19c5197.png"},7958:function(e,t,n){t.Z=n.p+"assets/images/picker-ad967d092164420bebaea3cde3853d9c.png"},3073:function(e,t,n){t.Z=n.p+"assets/images/user-b0164a0392685de5a30bd7f27648a54e.png"}}]);