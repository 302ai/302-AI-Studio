// declare global {
//   interface Window {
//     electron: ElectronAPI;
//     api: WindowApiType;
//     service: {
//       configService: {
//         getLanguage: () => Promise<LanguageVarious>;
//         setLanguage: (language: LanguageVarious) => void;
//         setTheme: (theme: ThemeMode) => void;
//         setProviders: (providers: ModelProvider[]) => void;
//         getProviderModels: (providerId: string) => Promise<Model[]>;
//         setProviderModels: (providerId: string, models: Model[]) => void;
//         getModelSettings: () => Promise<ModelSettingData>;
//       };
//       threadsService: {
//         setActiveThread: (threadId: string) => void;
//       };
//       providerService: {
//         checkApiKey: (params: CheckApiKeyParams) => Promise<{
//           isOk: boolean;
//           errorMsg: string | null;
//         }>;
//         updateProviderConfig: (
//           providerId: string,
//           updates: Partial<ModelProvider>
//         ) => void;
//       };
//     };
//   }
// }
