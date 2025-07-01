import { notarize } from "@electron/notarize";

export default async function (context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize on macOS platform
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization: Not macOS platform');
    return;
  }

  // Check required environment variables
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.ASC_PROVIDER) {
    console.warn('⚠️  Notarization credentials not found, skipping notarization');
    console.log('Please set the following environment variables:');
    console.log('- APPLE_ID: Apple Developer account');
    console.log('- APPLE_ID_PASSWORD: App-specific password');
    console.log('- ASC_PROVIDER: Certificate provider (Team ID)');
    return;
  }

  console.log('Starting macOS app notarization...');

  // Get app path and info
  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;
  const appBundleId = context.packager.appInfo.id;

  console.log(`App path: ${appPath}`);
  console.log(`Bundle ID: ${appBundleId}`);
  console.log(`Certificate provider: ${process.env.ASC_PROVIDER}`);

  try {
    console.log('Uploading app for notarization, this may take several minutes...');

    await notarize({
      tool: 'notarytool',
      appPath: appPath,
      appBundleId: appBundleId,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.ASC_PROVIDER
    });

    console.log('✅ App notarization successful!');
  } catch (error) {
    console.error('❌ App notarization failed:', error.message);

    // Provide error handling suggestions
    if (error.message.includes('Invalid credentials')) {
      console.error('Please check if Apple ID and app-specific password are correct');
    } else if (error.message.includes('Bundle ID')) {
      console.error('Please check if Bundle ID matches your Apple Developer account');
    } else if (error.message.includes('network')) {
      console.error('Network connection issue, please check your internet connection');
    }

    // In CI environment, notarization failure should cause build to fail
    if (process.env.CI) {
      throw error;
    } else {
      console.warn('Local build continues, but app is not notarized');
    }
  }
}

