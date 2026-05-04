# Guia para Compilar o App Android - NextFund

## Pré-requisitos

1. **Android Studio** instalado
2. **Java Development Kit (JDK) 17** ou superior
3. **Android SDK** configurado

## Passos para gerar o APK

### 1. Instalar dependências
```bash
npm install
```

### 2. Compilar o projeto web
```bash
npm run build
```

### 3. Sincronizar com Capacitor
```bash
npx cap sync
```

### 4. Abrir no Android Studio
```bash
npx cap open android
```

### 5. No Android Studio:

1. **Aguarde a indexação** do projeto terminar
2. **Configure o signing** (para release):
   - File → Project Structure → Modules → app → Signing Configs
   - Ou use o debug signing para testes

3. **Gerar APK**:
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Ou para release: Build → Generate Signed Bundle / APK

### 6. Localizar o APK

O APK será gerado em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

Ou para release:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Comandos úteis

```bash
# Atualizar o app após mudanças no código
npm run build && npx cap sync

# Abrir Android Studio
npx cap open android

# Verificar configuração
npx cap doctor

# Limpar cache (se necessário)
npx cap clean android
```

## Configurações importantes

- **App ID**: `com.nextfund.app`
- **App Name**: `NextFund`
- **Ícones**: Localizados em `public/icons/`
- **Manifest**: `public/manifest.json`

## Personalização do ícone

Os ícones do app estão em `public/icons/` e são automaticamente copiados para o projeto Android durante o `cap sync`.

Para atualizar ícones:
1. Substitua os arquivos em `public/icons/`
2. Execute `npx cap sync`
3. Recompile no Android Studio

## Problemas comuns

1. **Gradle sync failed**: Verifique se o JDK 17+ está instalado
2. **Build failed**: Limpe o projeto (Build → Clean Project)
3. **Ícone não aparece**: Execute `npx cap sync` novamente
4. **App crashes**: Verifique os logs no Android Studio (Logcat)

## Testando o app

1. **Emulador**: Configure um AVD no Android Studio
2. **Dispositivo físico**: Ative o modo desenvolvedor e depuração USB
3. **Run**: Clique no botão Play verde no Android Studio
