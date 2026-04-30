# Copilot instructions (WtyczkaFTG)

## Jezyk i styl

- Odpowiadaj po polsku, krotko i konkretnie.
- Zmiany wprowadzaj mozliwie minimalnie, bez refaktoryzacji niezwiazanych fragmentow.

## Zakres pracy

- Przy kazdej zmianie podawaj: co zmieniono, gdzie i po co.
- Zachowuj zgodnosc ze stylem istniejacych plikow projektu.

## Changelog (obowiazkowe)

- CHANGELOG.md jest utrzymywany wylacznie w jezyku angielskim.
- Kazda nowa funkcje, poprawke lub zmiane zachowania dopisuj do CHANGELOG.md w sekcji biezacej wersji.
- Kazde podbicie wersji musi miec odpowiadajacy wpis release w CHANGELOG.md.
- Nie pomijaj changeloga przy zadnej iteracji, ktora zmienia funkcjonalnosc rozszerzenia.

## Wersjonowanie (obowiazkowe)

- Aktualnie rozwijana wersja glowna to np. 0.3.8. Nie podbijaj jej bez wyraznej decyzji uzytkownika.
- Kazda kolejna zmiana w ramach biezacej wersji glownej dostaje przyrostek: 0.3.8.1, 0.3.8.2, itd. (tylko w CHANGELOG - dla czytelnosci).
- W package.json wersja musi byc semver-compatible (tylko MAJOR.MINOR.PATCH), wiec zapisujemy: 0.3.81, 0.3.82, 0.3.83 itd.
- Wpisy w CHANGELOG.md oznaczamy 0.3.8.X (package: 0.3.8X) zeby bylo jasne przetozenie.
- Dopiero uzytkownik decyduje kiedy przechodzimy do 0.3.9 (lub wyzszej wersji glownej).

## Budowanie i instalacja (obowiazkowe po kazdej zmianie)

Po kazdej zmianie kodu rozszerzenia zawsze wykonaj kolejno:

0. Zaktualizuj etykietę submenú w `package.json` (`"label": "FTG Toolkit vX.X.X"`) — musi zgadzać się z nowym numerem wersji.
1. Spakuj nowe .vsix:
   npx @vscode/vsce package --allow-missing-repository --out ftg-refs-codelens-<wersja>.vsix
2. Zainstaluj rozszerzenie:
   code --install-extension "v:\WtyczkaFTG\ftg-refs-codelens-<wersja>.vsix" --force
3. Poinformuj uzytkownika, ze nalezy wykonac Developer: Reload Window w VS Code, aby zmiany weszly w zycie.
