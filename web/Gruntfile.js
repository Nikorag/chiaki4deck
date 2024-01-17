module.exports = function(grunt) {
  grunt.initConfig({
    less: {
      development: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: {
          "public/css/base.css": "server/_ui/less/**/*.less"
        }
      }
    },
    cssmin: {
      target: {
        files: {
          "public/css/base.min.css": ["public/css/base.css"]
        }
      }
    },
    concat: {
      options: {
        separator: ';',
        sourceMap :true
      },
      dist: {
        src: ['server/_ui/js/**/app.js', 'server/_ui/js/**/*.js'],
        dest: 'public/js/app.js',
      },
    },
    uglify: {
      options: {
        mangle: false,
        sourceMap : true,
        sourceMapIncludeSources : true,
        sourceMapIn : 'public/js/app.js.map'
      },
      dist: {
        files: {
          'public/js/app.min.js': ['public/js/app.js']
        }
      }
    },
    clean: {
      js: ['public/js/app.js', 'public/js/app.js.map'],
      css: ['public/css/base.css']
    },
    watch: {
      options: {
        livereload: true,
      },
      styles: {
        files: ["server/_ui/less/*.less"],
        tasks: ["less", "cssmin", "clean:css"]
      },
      scripts: {
        files: ["server/_ui/js/*.js"],
        tasks: ["concat", "uglify", "clean:js"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask("default", ["less", "cssmin", "concat", "uglify", "clean:js", "clean:css"]);
  grunt.registerTask("watch-changes", ["watch"]);
};
