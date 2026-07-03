module.exports = {

  forbidden: [

    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: {
        circular: true
      }
    },

    {
      name: "no-import-pages",
      severity: "error",
      from: {
        path: "^src"
      },
      to: {
        path: "^src/pages"
      }
    },

    {
      name: "shared-no-feature",
      severity: "error",
      from: {
        path: "^src/shared"
      },
      to: {
        path: "^src/features"
      }
    },

    {
      name: "shared-no-entity",
      severity: "error",
      from: {
        path: "^src/shared"
      },
      to: {
        path: "^src/entities"
      }
    },

    {
      name: "entity-no-feature",
      severity: "error",
      from: {
        path: "^src/entities"
      },
      to: {
        path: "^src/features"
      }
    },

    {
      name: "entity-no-widget",
      severity: "error",
      from: {
        path: "^src/entities"
      },
      to: {
        path: "^src/widgets"
      }
    },

    {
      name: "feature-no-page",
      severity: "error",
      from: {
        path: "^src/features"
      },
      to: {
        path: "^src/pages"
      }
    },

    {
      name: "widget-no-page",
      severity: "error",
      from: {
        path: "^src/widgets"
      },
      to: {
        path: "^src/pages"
      }
    },

    {
      name: "feature-feature",
      severity: "warn",
      from: {
        path: "^src/features/([^/]+)"
      },
      to: {
        path: "^src/features/([^/]+)",
        pathNot: "^src/features/\$1"
      }
    }

  ],

  options: {

    tsPreCompilationDeps: true,

    combinedDependencies: true,

    includeOnly: "^src",

    doNotFollow: {
      path: "node_modules"
    },

    reporterOptions: {

      dot: {

        collapsePattern: "node_modules/[^/]+"

      }

    }

  }

}
