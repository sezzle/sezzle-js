var gulp = require('gulp'),
  sass = require('gulp-ruby-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  cssnano = require('gulp-cssnano'),
  rename = require('gulp-rename'),
  del = require('del'),
  s3 = require('gulp-s3-upload')(config),
  rp = require('request-promise'),
  config = { useIAM: true },
  webpack = require('webpack-stream'),
  pjson = require('./package.json'),
  language = require('./modals/language.json'),
  git = require('gulp-git'),
  compareVersions = require('compare-versions'),
  exec = require('child_process').exec,
	jeditor = require("gulp-json-editor"),
  htmlmin = require('gulp-htmlmin');
  argv = require('yargs').argv;
  merge = require('merge-stream');
  fs = require('fs');


var buttonUploadName = `sezzle-widget${pjson.version}.js`;
var globalCssUploadName = `sezzle-styles-global${pjson.cssversion}.css`;

/**
 * Tasks for the CSS
 */

// cleans up dist directory
gulp.task('cleancss', function () {
  return del(['dist/global-css/**']);
});

// compiles scss and minifies
gulp.task('csscompile', function () {
  return sass('./styles/global.scss', {
    style: 'expanded'
  })
    .pipe(autoprefixer('last 2 version'))
    .pipe(gulp.dest('dist/global-css'))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(cssnano({
      zindex: false
    }))
    .pipe(gulp.dest('dist/global-css'))
});

gulp.task('cssupload', function () {
  // bucket base url https://d3svog4tlx445w.cloudfront.net/
  var indexPath = './dist/global-css/global.min.css'
  return gulp.src(indexPath)
    .pipe(rename(`shopify-app/assets/${globalCssUploadName}`))
    .pipe(s3({
      Bucket: 'sezzlemedia', //  Required
      ACL: 'public-read'       //  Needs to be user-defined
    }, {
      maxRetries: 5
    }))
});

gulp.task('post-button-css-to-wrapper', function () {
  console.log('Posting css version to shopify gateway')
  var options = {
    method: 'POST',
    uri: 'https://widget.sezzle.com/v1/css/price-widget/version',
    body: {
      'version_name': globalCssUploadName
    },
    json: true
  }
  return rp(options)
    .then(function (body) {
      console.log('Posted new version to shopify wrapper')
    })
    .catch(function (err) {
      console.log('Post failed with sezzle pay, ')
      console.log(err);
    })
});

/**
 * Tasks for the modal
 */

gulp.task('cleanmodal', function () {
  return del(['dist/modals*/**']);
});

// minifies html for modal
gulp.task('minify-modal', function () {
  const languages = language[pjson.modalversion];
  let steams = [];
  languages.forEach((lang) => {
    const steam = gulp.src(`./modals/modals-${pjson.modalversion}/modal-${lang}.html`)
      .pipe(htmlmin({ collapseWhitespace: true, minifyCSS: true }))
      .pipe(rename(`sezzle-modal-${pjson.modalversion}-${lang}.html`))
      .pipe(gulp.dest(`dist/modals-${pjson.modalversion}`));
    steams.push(steam);
  });
	return merge(steams);
})

gulp.task('modalupload', function () {
  // bucket base url https://d3svog4tlx445w.cloudfront.net/
  const languages = language[pjson.modalversion];
  let steams = [];
  languages.forEach((lang) => {
    var indexPath = `./dist/modals-${pjson.modalversion}/sezzle-modal-${pjson.modalversion}-${lang}.html`;
    const steam = gulp.src(indexPath)
      .pipe(rename(`shopify-app/assets/sezzle-modal-${pjson.modalversion}-${lang}.html`))
      .pipe(s3({
        Bucket: 'sezzlemedia', //  Required
        ACL: 'public-read'     //  Needs to be user-defined
      }, {
        maxRetries: 5
      }))
    steams.push(steam);
  });
  return merge(steams);
});

gulp.task('post-modal-to-wrapper', function () {
  console.log('Posting modal version to shopify gateway')
  var options = {
    method: 'POST',
    uri: 'https://widget.sezzle.com/v1/modal/price-widget/version',
    body: {
      'version': `sezzle-modal-${pjson.modalversion}-{%%s%%}.html`,
      'language': language[pjson.modalversion]
    },
    json: true
  }
  return rp(options)
    .then(function (body) {
      console.log('Posted new modal version to shopify wrapper')
    })
    .catch(function (err) {
      console.log('Post failed with sezzle pay, ')
      console.log(err);
    })
});

/**
 * Tasks for the sezzle-js widget
 */

gulp.task('bundlejs', function () {
  return gulp.src('src/sezzle-init.js')
    .pipe(webpack({
      output: {
        filename: buttonUploadName
      },
      optimization: {
        minimize: false // <---- disables uglify.
      },
      mode: 'production'
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('upload-widget', function (done) {
  var indexPath = `./dist/${buttonUploadName}`
  return gulp.src(indexPath)
    .pipe(s3({
      Bucket: 'sezzle-shopify-application', //  Required
      ACL: 'public-read'       //  Needs to be user-defined
    }, {
        // S3 Constructor Options, ie:
        maxRetries: 5
      }));
});

gulp.task('post-button-to-widget-server', function () {
  var options = {
    method: 'POST',
    uri: 'https://widget.sezzle.com/v1/javascript/price-widget/version',
    body: {
      'version_name': buttonUploadName
    },
    json: true
  }
  return rp(options)
    .then(function (body) {
      console.log('Posted new version to shopify wrapper')
    })
    .catch(function (err) {
      console.log('Post failed with shopify, ')
      console.log(err);
    })
});

function versionCheck(oldVersion) {
  newVersion = argv.newversion;
  if(typeof(newVersion) === 'boolean' ||
    typeof(newVersion) === 'undefined' ||
    !(/^\d{1,2}\.\d{1,2}\.\d{1,2}$/.test(newVersion)) ||
    compareVersions(newVersion, oldVersion) < 1
  ) {
    throw 'Invalid value for newversion';
  };
}

gulp.task('grabversion', function(done) {
  versionCheck(pjson.version);
  done();
})

gulp.task('grabversioncss', function(done) {
  versionCheck(pjson.cssversion);
  done();
})

gulp.task('grabversionmodal', function(done) {
  versionCheck(pjson.modalversion);
  if (!language[argv.newversion]) {
    throw 'No language defined for this version';
  } else {
    language[argv.newversion].forEach(lang => {
      fs.access(`./modals/modals-${argv.newversion}/modal-${lang}.html`, (err) => {
        if (err) {
          throw `No file found: ./modals/modals-${argv.newversion}/modal-${lang}.html`;
        }
      });
    });
  }
  done();
})

function updateVersion(params) {
  return gulp.src(['./package.json', './package-lock.json'])
    .pipe(jeditor(params))
    .pipe(gulp.dest('./'));
}

function commitVersion(type, version) {
  return gulp.src('./package.json')
    .pipe(git.commit(`bumped ${type} version to: ${version}`));
}

gulp.task('updatepackage', function() {
  return updateVersion({version: argv.newversion});
})

gulp.task('updatepackagecss', function() {
  return updateVersion({cssversion: argv.newversion});
})

gulp.task('updatepackagemodal', function() {
  return updateVersion({modalversion: argv.newversion});
})

gulp.task('commitupdate', function() {
  return commitVersion('js', argv.newversion);
})

gulp.task('commitupdatecss', function() {
  return commitVersion('css', argv.newversion);
})

gulp.task('commitupdatemodal', function() {
  return commitVersion('modal', argv.newversion);
})

gulp.task('createtag', function(done) {
  git.tag(`v${argv.newversion}`, '', function (err) {
    if (err) throw err;
    git.push('origin', `v${argv.newversion}`, function (err) {
      if (err) throw err;
      done();
    });
  });
})

function getbranchName(type) {
  return `version-${type}-${argv.newversion}`;
}
function createBranch(branchName, done) {
  git.checkout('master', function(err) {
    if (err) throw err;
    git.pull('origin', 'master', function (err) {
      if (err) throw err;
      git.checkout(branchName, {args:'-b'}, function (err) {
        if (err) throw err;
        done();
      });
    });
  })
}
gulp.task('newbranch', function(done) {
  createBranch(getbranchName('js'), done);
})
gulp.task('newbranchcss', function(done) {
  createBranch(getbranchName('css'), done);
})
gulp.task('newbranchmodal', function(done) {
  createBranch(getbranchName('modal'), done);
})

function pushBranch(branchName, done) {
  git.push('origin', branchName, function (err) {
    if (err) throw err;
    done();
  });
}
gulp.task('pushversion', function(done) {
  pushBranch(getbranchName('js'), done);
})
gulp.task('pushversioncss', function(done) {
  pushBranch(getbranchName('css'), done);
})
gulp.task('pushversionmodal', function(done) {
  pushBranch(getbranchName('modal'), done);
})

gulp.task('styles', gulp.series('cleancss', 'csscompile'));

gulp.task('deploywidget', gulp.series('bundlejs', 'upload-widget', 'post-button-to-widget-server'));
gulp.task('deploycss', gulp.series('styles', 'cssupload', 'post-button-css-to-wrapper'));
gulp.task('deploymodal', gulp.series('cleanmodal', 'minify-modal', 'modalupload', 'post-modal-to-wrapper'));

// local processes
gulp.task('release', gulp.series('grabversion', 'newbranch', 'updatepackage', 'commitupdate', 'pushversion'));
gulp.task('release-css', gulp.series('grabversioncss', 'newbranchcss', 'updatepackagecss', 'commitupdatecss', 'pushversioncss'));
gulp.task('release-modal', gulp.series('grabversionmodal', 'newbranchmodal', 'updatepackagemodal', 'commitupdatemodal', 'pushversionmodal'))

// CI processes
gulp.task('deploy', function (done) {
  // Check if there is any version commit
  exec('git log --pretty=format:%s -2 | tail', function (err, stdout, stderr) {
    if (err) throw err;
    var commits = stdout.split('\n');
    if (commits.length === 2) {
      var versionCommit = '';
      // check if the first commit is a Merge commit
      if (commits[0].indexOf('Merge pull request') > -1) {
        // Then the second commit should be the version commit
        versionCommit = commits[1];
      } else {
        // Or the first commit should be the version commit
        versionCommit = commits[0];
      }
      if (versionCommit.indexOf('bumped js version to:') > -1) {
        console.log(versionCommit);
        console.log('Updating JS version');
        exec('npx gulp deploywidget', function(err, stdout, stderr) {
          if (err) throw err;
          console.log(stdout);
          done();
        });
      } else if (versionCommit.indexOf('bumped css version to:') > -1) {
        console.log(versionCommit);
        console.log('Updating CSS version');
        exec('npx gulp deploycss', function(err, stdout, stderr) {
          if (err) throw err;
          console.log(stdout);
          done();
        })
      } else if (versionCommit.indexOf('bumped modal version to:') > -1) {
        console.log(versionCommit);
        console.log('Updating Modal version');
        exec('npx gulp deploymodal', function(err, stdout, stderr) {
          if (err) throw err;
          console.log(stdout);
          done();
        })
      } else {
        console.log('No version change commit found');
        done();
      }
    } else {
      console.log('No version change commit found');
      done();
    }
  })
});
