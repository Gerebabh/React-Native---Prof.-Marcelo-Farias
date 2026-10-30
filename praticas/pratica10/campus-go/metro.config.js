const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// O Expo Go do Android não tem o módulo de tópicos push (que não usamos).
// Trocamos por uma versão vazia para as notificações locais funcionarem.
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === './TopicSubscriptionModule' && context.originModulePath.includes('expo-notifications')) {
    return {
      type: 'sourceFile',
      filePath: require.resolve('expo-notifications/build/TopicSubscriptionModule.js'),
    };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
