// Evita abrir uma janela de terminal no Windows nas versões finais.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    macreader_lib::run();
}
