# @neolution-ch/formik-ui

The @neolution-ch/formik-ui package contains common formik form elements.

## Storybook

The storybook is a visual testing tool that makes it easy to test and tinker with the components.

It can be found at https://neolution-ch.github.io/react-data-table

## Peer Dependencies

- formik
- react
- react-dom
- reacstrap

## Changelog

### 1.0.0

- Created Package

### 1.2.0

- added field only prop to only render the field without a label
- added on blur event to the props
- added the number format config to configure the input with react-number-format

### 1.1.0

- Created tests
- Added children to the `InputField` so it can be used as a select / dropdown element
- Updated all packages
- Added parseAs property to `InputField`

### 1.1.2

- Fixed empty package bug
- Added yarn build as prepack task in package.json

### 1.2.1

- Fixed bug with nested values for checkbox initial vlaue
- Fixed bug for defaultChecked
