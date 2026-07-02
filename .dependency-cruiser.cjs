/** @type {import('dependency-cruiser').IConfiguration} */

module.exports = {
  forbidden: [

    //----------------------------------------------------------------------
    // QUALITY
    //----------------------------------------------------------------------

    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: {
        circular: true
      }
    },

    {
      name: "no-orphans",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          "^src/main.tsx?$",
          "^src/vite-env.d.ts"
        ]
      },
      to: {}
    },

    {
      name: "no-duplicate-dependencies",
      severity: "warn",
      from: {},
      to: {
        moreThanOneDependencyType: true
      }
    },

    //----------------------------------------------------------------------
    // APP
    //----------------------------------------------------------------------

    {
      name: "app-cannot-be-imported",
      severity: "error",
      from: {
        pathNot: "^src/app"
      },
      to: {
        path: "^src/app"
      }
    },

    //----------------------------------------------------------------------
    // PAGES
    //----------------------------------------------------------------------

    {
      name: "pages-cannot-import-pages",
      severity: "error",
      from: {
        path: "^src/pages"
      },
      to: {
        path: "^src/pages"
      }
    },

    {
      name: "pages-cannot-import-data",
      severity: "warn",
      from: {
        path: "^src/pages"
      },
      to: {
        path: "^src/data"
      }
    },

    //----------------------------------------------------------------------
    // WIDGETS
    //----------------------------------------------------------------------

    {
      name: "widgets-cannot-import-pages",
      severity: "error",
      from: {
        path: "^src/widgets"
      },
      to: {
        path: "^src/pages"
      }
    },

    //----------------------------------------------------------------------
    // FEATURES
    //----------------------------------------------------------------------

    {
      name: "feature-to-feature",
      severity: "warn",
      from: {
        path: "^src/features/([^/]+)/"
      },
      to: {
        path: "^src/features/([^/]+)/",
        pathNot: "^src/features/$1/"
      }
    },

    //----------------------------------------------------------------------
    // ENTITIES
    //----------------------------------------------------------------------

    {
      name: "entities-cannot-import-features",
      severity: "error",
      from: {
        path: "^src/entities"
      },
      to: {
        path: "^src/features"
      }
    },

    {
      name: "entities-cannot-import-pages",
      severity: "error",
      from: {
        path: "^src/entities"
      },
      to: {
        path: "^src/pages"
      }
    },

    {
      name: "entities-cannot-import-widgets",
      severity: "error",
      from: {
        path: "^src/entities"
      },
      to: {
        path: "^src/widgets"
      }
    },

    //----------------------------------------------------------------------
    // SHARED
    //----------------------------------------------------------------------

    {
      name: "shared-cannot-import-pages",
      severity: "error",
      from: {
        path: "^src/shared"
      },
      to: {
        path: "^src/pages"
      }
    },

    {
      name: "shared-cannot-import-widgets",
      severity: "error",
      from: {
        path: "^src/shared"
      },
      to: {
        path: "^src/widgets"
      }
    },

    {
      name: "shared-cannot-import-features",
      severity: "error",
      from: {
        path: "^src/shared"
      },
      to: {
        path: "^src/features"
      }
    },

    {
      name: "shared-cannot-import-entities",
      severity: "warn",
      from: {
        path: "^src/shared"
      },
      to: {
        path: "^src/entities"
      }
    },

    //----------------------------------------------------------------------
    // INFRASTRUCTURE
    //----------------------------------------------------------------------

    {
      name: "infra-cannot-import-pages",
      severity: "error",
      from: {
        path: "^src/infrastructure"
      },
      to: {
        path: "^src/pages"
      }
    },

    {
      name: "infra-cannot-import-widgets",
      severity: "error",
      from: {
        path: "^src/infrastructure"
      },
      to: {
        path: "^src/widgets"
      }
    },

    //----------------------------------------------------------------------
    // DATA
    //----------------------------------------------------------------------

    {
      name: "data-cannot-import-ui",
      severity: "error",
      from: {
        path: "^src/data"
      },
      to: {
        path: "^src/(pages|widgets|features|design-system)"
      }
    },

    //----------------------------------------------------------------------
    // TEST
    //----------------------------------------------------------------------

    {
      name: "no-test-in-production",
      severity: "warn",
      from: {
        pathNot: "\\.(test|spec)\\."
      },
      to: {
        path: "\\.(test|spec)\\."
      }
    }

  ],

  options: {

    tsConfig: {
      fileName: "./tsconfig.json"
    },

    doNotFollow: {
      path: "node_modules"
    },

    exclude: {
      path: [
        "node_modules",
        "dist",
        "coverage",
        "reports"
      ]
    },

    enhancedResolveOptions: {
      extensions: [
        ".ts",
        ".tsx",
        ".js",
        ".jsx"
      ]
    }

  }
};