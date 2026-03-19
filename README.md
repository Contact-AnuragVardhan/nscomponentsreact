# nsComponentsReact

React wrapper components for the NSComponents UI library.

This package exposes React-friendly wrappers around the generated NSComponents JavaScript and CSS assets, along with TypeScript types for the main component settings.

## Features

- React wrappers for NSComponents widgets
- TypeScript type exports for component settings and callbacks
- Bundled generated JS and CSS assets under `build/generated`
- Support for React `18` and `19`
- Optional integration with `react-router-dom` for navigation components

## Installation

Install the package and its peer dependencies:

```bash
npm install nscomponentsreact react react-dom react-router-dom
```

Peer dependency ranges:

- `react`: `^18.0.0 || ^19.0.0`
- `react-dom`: `^18.0.0 || ^19.0.0`
- `react-router-dom`: `^6.0.0 || ^7.0.0`

## Available Exports

React components currently exported from the package:

- `NSAjaxReact`
- `NSCalendarReact`
- `NSDatePickerReact`
- `NSDashboardReact`
- `NSEditorReact`
- `NSGridReact`
- `NSHorizontalNavigationReact`
- `NSMessageBoxReact`
- `NSMultiselectDropdownReact`
- `NSNavigationReact`
- `NSPanelReact`
- `NSTabNavigatorReact`
- `NSTextBoxReact`
- `DynamicComponentService`

The package also exports the underlying NSComponents constructors such as `NSGrid`, `NSNavigation`, `NSDashboard`, `NSTextBox`, and related TypeScript types from `src/index.ts`.

## Basic Usage

### Text box

```tsx
import React from "react";
import { NSTextBoxReact } from "nscomponentsreact";

export function SearchBox() {
  return (
    <NSTextBoxReact
      containerStyle={{ width: "280px" }}
      setting={{
        placeholder: "Search",
      }}
    />
  );
}
```

### Horizontal navigation

`NSHorizontalNavigationReact` can use `react-router-dom` when rendered inside a router. Menu items can provide `href` or `link`, and the component will navigate for you.

```tsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import {
  NSHorizontalNavigationReact,
  INSHorizontalNavigationMenu,
} from "nscomponentsreact";

const menuItems: INSHorizontalNavigationMenu[] = [
  { menuName: "Home", href: "/" },
  { menuName: "Orders", href: "/orders" },
  {
    menuName: "Admin",
    childMenus: [
      { menuName: "Users", href: "/admin/users" },
      { menuName: "Roles", href: "/admin/roles" },
    ],
  },
];

export function AppNavigation() {
  return (
    <BrowserRouter>
      <NSHorizontalNavigationReact
        setting={{
          dataSource: menuItems,
          enableAnimation: true,
          enableOpenOnClick: true,
        }}
      />
    </BrowserRouter>
  );
}
```

### Dashboard with React content

`NSDashboardReact` supports React content components through the internal `DynamicComponentService`.

```tsx
import React from "react";
import { NSDashboardReact } from "nscomponentsreact";

function SalesPanel() {
  return <div style={{ padding: 16 }}>Sales summary</div>;
}

export function DashboardExample() {
  return (
    <NSDashboardReact
      containerStyle={{ width: "100%" }}
      setting={{
        panelPerRow: 2,
        arrPanelSetting: [
          {
            title: "Overview",
            contentComponent: SalesPanel,
          },
        ],
      }}
    />
  );
}
```

## TypeScript

The library exports interfaces for component settings, menu models, callbacks, and imperative refs. A few common examples:

- `INSTextBoxReactSetting`
- `INSHorizontalNavigationReactSettings`
- `INSHorizontalNavigationReactRef`
- `INSDashboardReactSettings`
- `INSGridSetting`
- `INSNavigationSetting`

See [src/index.ts](/d:/ReactAngularWorkspace/nsComponentsReact/src/index.ts) for the complete export surface.

## Development

Useful local scripts:

```bash
npm run build
npm run lint
npm run format
npm test
```

## Build Output

The library is bundled with Rollup and publishes:

- CommonJS: `build/index.js`
- ESM: `build/index.esm.js`
- Types: `build/index.d.ts`

The build step also copies generated static assets from `src/generated` into `build/generated`.

## Repository

- Homepage: <https://nscomponent.com/>
- Source: <https://github.com/nscomponents/nscomponentsreact>
- Issues: <https://github.com/nscomponents/nscomponentsreact/issues>

## License

MIT. See [LICENSE](/d:/ReactAngularWorkspace/nsComponentsReact/LICENSE).
