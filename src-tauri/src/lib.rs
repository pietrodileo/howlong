use std::fs;
use std::path::{Path, PathBuf};

use tauri::Manager;

const DEFAULT_SETTINGS: &str = r#"{
  "defaultCategories": ["Analisi", "Sviluppo", "Test", "Collaudo", "Rilascio"],
  "defaultContingencyPercentage": 20,
  "contingencyTargetCategories": ["Sviluppo", "Test"],
  "defaultContingencyMode": "project",
  "defaultContingencyPlacement": "both",
  "defaultClientRoundingMode": "ceil_1",
  "hoursPerDay": 8,
  "locale": "it",
  "username": ""
}"#;

const DEFAULT_MODEL: &str = r#"{
  "schemaVersion": 1,
  "id": "modello-standard",
  "name": "Modello standard",
  "macroActivities": [
    { "id": "1", "name": "Analisi e documentazione", "category": "Analisi", "defaultHours": 0, "kind": "operational" },
    { "id": "2", "name": "Sviluppo", "category": "Sviluppo", "defaultHours": 0, "kind": "operational" },
    { "id": "3", "name": "Test", "category": "Test", "defaultHours": 0, "kind": "operational" },
    { "id": "4", "name": "Collaudo", "category": "Collaudo", "defaultHours": 0, "kind": "operational" },
    { "id": "5", "name": "Rilascio e monitoraggio", "category": "Rilascio", "defaultHours": 0, "kind": "operational" }
  ],
  "categories": ["Analisi", "Sviluppo", "Test", "Collaudo", "Rilascio"],
  "hoursPerDay": 8,
  "contingency": {
    "defaultPercent": 20,
    "mode": "project",
    "targetCategories": [],
    "placement": "both"
  }
}"#;

fn app_data_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Impossibile risolvere app data dir: {e}"))
}

#[tauri::command]
fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    Ok(app_data_path(&app)?.to_string_lossy().to_string())
}

#[tauri::command]
fn join_path(parts: Vec<String>) -> String {
    let mut path = PathBuf::new();
    for part in parts {
        path.push(part);
    }
    path.to_string_lossy().to_string()
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Lettura fallita ({path}): {e}"))
}

#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Creazione cartella fallita: {e}"))?;
    }
    fs::write(&path, contents).map_err(|e| format!("Scrittura fallita ({path}): {e}"))
}

#[tauri::command]
fn write_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Creazione cartella fallita: {e}"))?;
    }
    fs::write(&path, contents).map_err(|e| format!("Scrittura binaria fallita ({path}): {e}"))
}

#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    if !Path::new(&path).exists() {
        return Ok(());
    }
    fs::remove_file(&path).map_err(|e| format!("Eliminazione fallita ({path}): {e}"))
}

#[tauri::command]
fn read_binary_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| format!("Lettura binaria fallita ({path}): {e}"))
}

#[tauri::command]
fn ensure_app_defaults(app: tauri::AppHandle) -> Result<String, String> {
    let dir = app_data_path(&app)?;
    fs::create_dir_all(&dir).map_err(|e| format!("Creazione app data fallita: {e}"))?;

    let models_dir = dir.join("models");
    fs::create_dir_all(&models_dir).map_err(|e| format!("Creazione models fallita: {e}"))?;

    let estimates_dir = dir.join("estimates");
    fs::create_dir_all(&estimates_dir)
        .map_err(|e| format!("Creazione estimates fallita: {e}"))?;

    let settings_path = dir.join("settings.json");
    if !settings_path.exists() {
        fs::write(&settings_path, DEFAULT_SETTINGS)
            .map_err(|e| format!("Scrittura settings default fallita: {e}"))?;
    }

    let default_model = models_dir.join("default.howlong.json");
    if !default_model.exists() {
        fs::write(&default_model, DEFAULT_MODEL)
            .map_err(|e| format!("Scrittura modello default fallita: {e}"))?;
    }

    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
fn list_model_files(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = app_data_path(&app)?.join("models");
    list_json_files_in(&dir)
}

#[tauri::command]
fn ensure_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| format!("Creazione cartella fallita ({path}): {e}"))
}

#[tauri::command]
fn list_json_files(dir: String) -> Result<Vec<String>, String> {
    list_json_files_in(Path::new(&dir))
}

fn list_json_files_in(dir: &Path) -> Result<Vec<String>, String> {
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut files = Vec::new();
    for entry in fs::read_dir(dir).map_err(|e| format!("Lettura cartella fallita: {e}"))? {
        let entry = entry.map_err(|e| format!("Entry: {e}"))?;
        let path = entry.path();
        if path.is_file() {
            let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if name.ends_with(".json") {
                files.push(path.to_string_lossy().to_string());
            }
        }
    }
    files.sort();
    Ok(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_app_data_dir,
            join_path,
            read_text_file,
            write_text_file,
            write_binary_file,
            read_binary_file,
            delete_file,
            ensure_app_defaults,
            ensure_dir,
            list_model_files,
            list_json_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
