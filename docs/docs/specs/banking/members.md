# Members

Account memberships provide account access to as many people as needed with various levels of permission.
Learn more about [account memberships](https://docs.swan.io/guide/give-access-to-your-account) in our main documentation.

## Primary members content

Along with the main navigation, the **members page** should include the following content:

- Button to add a new account membership
- Filters for **status** and **permission type**
- List of current account memberships
  - Full name
  - Permissions (_can view account_, _can initiate payments_, _can manage memberships_, and _can manage beneficiaries_)
  - Email
  - Phone number
- Current status

![Screenshot of the main members page with sample content](./images/members-main.png)

## Add a new account member

When adding a new account member, the user should provide the following information about that person:

- First or given name
- Last or family name
- Phone number
- Birth date
- Email
- Permissions checkboxes (_can view account_, _can initiate payments_, _can manage memberships_, and _can manage beneficiaries_)

When the user clicks **Send invitation**, an invitation is sent to the potential new account member by email, which they must open and accept.

![Screenshot of modal to invite a new account member](./images/members-new.png)

:::caution 🇩🇪 Germany
For German accounts, **add a second step** asking for the **residency address** of the potential new account member. If that address in Germany, you must also collect their **tax identification number** (_Steuer-Identifikationsnummer_).
:::
