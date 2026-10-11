## Como instalar

Baixe o arquivo da sua plataforma na lista **Assets**, mais abaixo nesta página.

| Plataforma | Arquivo | Requisito |
| --- | --- | --- |
| macOS | `macreader-macos-universal-vX.Y.Z.dmg` | macOS 11 Big Sur ou mais novo, Intel ou Apple Silicon |
| Android | `macreader-android-vX.Y.Z.apk` | Android 8.0 ou mais novo |
| iPhone e iPad | `macreader-ios-vX.Y.Z.ipa` | iOS 15 ou mais novo, instalado pelo AltStore ou Sideloadly |

### macOS

1. Baixe o `.dmg` e abra o arquivo.
2. Arraste o **MacReader** para a pasta **Aplicativos**.
3. Na primeira vez, abra a pasta **Aplicativos**, clique com o botão direito no MacReader e escolha
   **Abrir**. Depois, confirme em **Abrir**. Essa etapa só aparece uma vez: o MacReader ainda não é
   notarizado pela Apple, que exige uma conta paga de desenvolvedor.
4. Se o macOS disser que o app "está danificado e não pode ser aberto", abra o **Terminal** e rode:

   ```sh
   xattr -dr com.apple.quarantine /Applications/MacReader.app
   ```

**Atualizações:** automáticas. Quando sai uma versão nova, o MacReader baixa e instala sozinho e
mostra o aviso **Reiniciar agora**.

### Android

1. No celular ou tablet, baixe o `.apk`.
2. Abra o arquivo em **Downloads** ou na notificação do download.
3. Se o Android pedir, toque em **Configurações** e ative **Permitir desta fonte** para o navegador ou
   o gerenciador de arquivos. Volte e toque em **Instalar**.
4. Se aparecer um aviso do Play Protect, toque em **Mais detalhes → Instalar mesmo assim**. O aviso
   aparece porque o app não vem da Play Store.

**Atualizações:** quando sai uma versão nova, o MacReader mostra o aviso **Baixar e instalar**. Toque
nele e confirme a instalação. Seus livros e destaques continuam no aparelho.

### iPhone e iPad

A Apple só permite instalar apps de fora da App Store assinando com um Apple ID. O jeito mais simples
é o **AltStore**, que é gratuito e assina e renova o app sozinho.

**Com o AltStore (recomendado):**

1. No computador (Mac ou Windows), instale o **AltServer** pelo site [altstore.io](https://altstore.io)
   e siga as instruções de lá para instalar o AltStore no iPhone.
2. No iPhone, ative o **Modo de Desenvolvedor**: **Ajustes → Privacidade e Segurança → Modo de
   Desenvolvedor**. O iPhone reinicia.
3. Abra o AltStore, vá em **Browse → Sources → +** e adicione a fonte do MacReader:

   ```
   https://github.com/marloon-dev/MacReader/releases/latest/download/altstore.json
   ```

4. Toque em **MacReader → Free / Instalar**.
5. Na primeira abertura, vá em **Ajustes → Geral → VPN e Gerenciamento de Dispositivos**, toque no
   seu Apple ID e em **Confiar**.

**Com o Sideloadly:** instale o [Sideloadly](https://sideloadly.io) no computador, conecte o iPhone
pelo cabo, arraste o `.ipa` para a janela, informe seu Apple ID e clique em **Start**. Depois, siga os
passos 2 e 5 acima.

**Validade:** com um Apple ID gratuito, a Apple faz o app expirar a cada **7 dias**. O AltStore
renova sozinho quando o iPhone e o computador com o AltServer estão na mesma rede Wi-Fi. Pelo
Sideloadly, é preciso reinstalar o app. Os seus livros não se perdem quando você renova.

**Atualizações:** quem usa a fonte do AltStore recebe as versões novas pela aba **Updates** do
AltStore. O MacReader também avisa quando há versão nova.

### Conferir o download

O arquivo `SHA256SUMS.txt` traz a soma de verificação de cada instalador. No Mac ou no Linux:

```sh
shasum -a 256 -c SHA256SUMS.txt --ignore-missing
```
