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
  git = require('gulp-git'),
  compareVersions = require('compare-versions'),
  exec = require('child_process').exec,
  jeditor = require("gulp-json-editor");


var buttonUploadName = `sezzle-widget${pjson.version}.js`;
var globalCssUploadName = `sezzle-styles-global${pjson.cssversion}.css`;
var newVersion = '';

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
    .pipe(rename('shopify-app/assets/' + globalCssUploadName))
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
  rp(options)
    .then(function (body) {
      console.log('Posted new version to shopify wrapper')
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
        filename: buttonUploadName,
        libraryTarget: 'umd',
        library: 'SezzleJS'
      },
      optimization: {
        minimize: true, // <---- disables uglify.
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
  var argv = require('yargs').argv;
  newVersion = argv.newversion;
  if(typeof(newVersion) === 'boolean' ||
    typeof(newVersion) === 'undefined' ||
    !(/^\d{1,2}\.\d{1,2}\.\d{1,2}$/.test(newVersion)) ||
    compareVersions(newVersion, oldVersion) < 1
  ) {
    throw 'Invalid value for newversion'
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

function updateVersion(params) {
  return gulp.src(['./package.json', './package-lock.json'])
    .pipe(jeditor(params))
    .pipe(gulp.dest('./'));
}

gulp.task('updatepackage', function() {
  return updateVersion({version: newVersion});
})

gulp.task('updatepackagecss', function() {
  return updateVersion({cssversion: newVersion});
})

gulp.task('commitupdate', function() {
  return gulp.src('./package.json')
    .pipe(git.commit(`bumped js version to: ${newVersion}`));
})

gulp.task('commitupdatecss', function() {
  return gulp.src('./package.json')
    .pipe(git.commit(`bumped css version: ${newVersion}`));
})

gulp.task('createtag', function(done) {
  git.tag(`v${newVersion}`, '', function (err) {
    if (err) throw err;
    git.push('origin', `v${newVersion}`, function (err) {
      if (err) throw err;
      done();
    });
  });
})

function getbranchName(type) {
  return `version-${type}-${newVersion}`;
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

gulp.task('styles', gulp.series('cleancss', 'csscompile'));

gulp.task('deploywidget', gulp.series('bundlejs', 'upload-widget', 'post-button-to-widget-server'));
gulp.task('deploycss', gulp.series('styles', 'cssupload', 'post-button-css-to-wrapper'));

// local processes
gulp.task('release', gulp.series('grabversion', 'newbranch', 'updatepackage', 'commitupdate', 'pushversion'));
gulp.task('release-css', gulp.series('grabversioncss', 'newbranchcss', 'updatepackagecss', 'commitupdatecss', 'pushversioncss'));

// CI processes
gulp.task('deploy', function (done) {
  // Check if there is any version commit
  exec('git log --pretty=format:%s -2 | tail', function (err, stdout, stderr) {
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
          console.log(stdout);
          done();
        });
      } else if (versionCommit.indexOf('bumped css version to:') > -1) {
        console.log(versionCommit);
        console.log('Updating CSS version');
        exec('npx gulp deploycss', function(err, stdout, stderr) {
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