const fs = require('node:fs');
const path = require('node:path');

const keystore = process.env.DIAR_ANDROID_KEYSTORE_PATH;
const password = process.env.DIAR_ANDROID_KEYSTORE_PASSWORD;
if (!keystore || !password || !fs.existsSync(keystore)) {
  throw new Error('Release keystore and password must be configured');
}

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf8');
const configMarker = /\n    }\n    buildTypes\s*\{/;
const releaseMarker = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?signingConfig\s+)signingConfigs\.debug/;
if (!gradle.includes('signingConfigs {') || !configMarker.test(gradle) || !releaseMarker.test(gradle)) {
  throw new Error('Could not locate expected Android signing configuration');
}
gradle = gradle.replace(configMarker, `
        release {
            storeFile file(System.getenv('DIAR_ANDROID_KEYSTORE_PATH'))
            storePassword System.getenv('DIAR_ANDROID_KEYSTORE_PASSWORD')
            keyAlias 'diar-release'
            keyPassword System.getenv('DIAR_ANDROID_KEYSTORE_PASSWORD')
        }
    }
    buildTypes {`);
gradle = gradle.replace(releaseMarker, '$1signingConfigs.release');
fs.writeFileSync(gradlePath, gradle);
