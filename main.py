import sys
import os
import time
import subprocess
import schedule
import pyautogui
from datetime import datetime
from PyQt5.QtWidgets import (QApplication, QSystemTrayIcon, QMenu, QAction, 
                             QMessageBox, QWidget, QVBoxLayout, QPushButton, 
                             QLabel, QHBoxLayout, QStyle)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from PyQt5.QtGui import QIcon, QFont
import json

DEFAULT_CONFIG = {
    "app_path": r"C:\\SERVCOM\\SERVCOM RGI\\servcom.exe",
    "save_path": r"\\\\Servidor\\indicador",
    "execution_time": "17:00"
}

def load_config():
    try:
        config_path = os.path.join(os.path.dirname(__file__), "..", "config", "config.json")
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                return json.load(f)
    except:
        pass
    return DEFAULT_CONFIG

CONFIG = load_config()
APP_PATH = CONFIG.get("app_path", DEFAULT_CONFIG["app_path"])
SAVE_PATH = CONFIG.get("save_path", DEFAULT_CONFIG["save_path"])
EXECUTION_TIME = CONFIG.get("execution_time", DEFAULT_CONFIG["execution_time"])

class AutomationWorker(QThread):
    status_signal = pyqtSignal(str)
    finished_signal = pyqtSignal(bool, str)
    
    def __init__(self):
        super().__init__()
        self.running = True
        
    def run(self):
        try:
            self.status_signal.emit("Iniciando automacao...")
            subprocess.Popen(APP_PATH)
            time.sleep(5)
            sequence = ["1", "1", "return", "2", "return", "3", "return", "1", "return", "return", "return"]
            for i, key in enumerate(sequence):
                if not self.running:
                    self.finished_signal.emit(False, "Automacao interrompida")
                    return
                self.status_signal.emit("Passo {} de {}: {}".format(i+1, len(sequence), key))
                pyautogui.press(key)
                time.sleep(0.5)
            time.sleep(2)
            pyautogui.typewrite(SAVE_PATH, interval=0.01)
            time.sleep(0.5)
            pyautogui.press("return")
            time.sleep(2)
            pyautogui.keyDown("alt")
            pyautogui.keyDown("f4")
            pyautogui.keyUp("f4")
            pyautogui.keyUp("alt")
            self.finished_signal.emit(True, "Arquivo salvo em: {}".format(SAVE_PATH))
        except Exception as e:
            self.finished_signal.emit(False, "Erro: {}".format(str(e)))

class SchedulerThread(QThread):
    trigger_signal = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.running = True
        self.active = True
        
    def run(self):
        schedule.every().monday.at(EXECUTION_TIME).do(self.trigger_job)
        schedule.every().tuesday.at(EXECUTION_TIME).do(self.trigger_job)
        schedule.every().wednesday.at(EXECUTION_TIME).do(self.trigger_job)
        schedule.every().thursday.at(EXECUTION_TIME).do(self.trigger_job)
        schedule.every().friday.at(EXECUTION_TIME).do(self.trigger_job)
        while self.running:
            if self.active:
                schedule.run_pending()
            time.sleep(30)
    
    def trigger_job(self):
        self.trigger_signal.emit()
        
    def stop(self):
        self.running = False
        
    def pause(self):
        self.active = False
        
    def resume(self):
        self.active = True

class ServcomAutomationApp(QWidget):
    def __init__(self):
        super().__init__()
        self.automation_worker = None
        self.scheduler = None
        self.is_running = False
        self.is_scheduler_active = True
        self.init_ui()
        self.init_tray()
        self.start_scheduler()
        self.hide()
        
    def init_ui(self):
        self.setWindowTitle("Servcom Automation")
        self.setGeometry(100, 100, 500, 300)
        self.setWindowFlags(Qt.WindowStaysOnTopHint)
        layout = QVBoxLayout()
        layout.setSpacing(20)
        layout.setContentsMargins(30, 30, 30, 30)
        title = QLabel("Servcom Automation")
        title.setFont(QFont("Segoe UI", 18, QFont.Bold))
        title.setAlignment(Qt.AlignCenter)
        title.setStyleSheet("color: #2c3e50;")
        layout.addWidget(title)
        self.status_label = QLabel("Status: Aguardando...")
        self.status_label.setFont(QFont("Segoe UI", 11))
        self.status_label.setAlignment(Qt.AlignCenter)
        self.status_label.setStyleSheet("QLabel { background-color: #ecf0f1; padding: 15px; border-radius: 8px; color: #2c3e50; }")
        layout.addWidget(self.status_label)
        info_text = "<p style='color: #7f8c8d; font-size: 10px; text-align: center;'>Aplicativo: Servcom RGI<br>Destino: {}<br>Horario: {} (Seg-Sex)<br>Inicia com Windows: Ativado</p>".format(SAVE_PATH, EXECUTION_TIME)
        info_label = QLabel(info_text)
        info_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(info_label)
        btn_layout = QHBoxLayout()
        self.play_btn = QPushButton("Play")
        self.play_btn.setStyleSheet("QPushButton { background-color: #27ae60; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; } QPushButton:hover { background-color: #27ae60dd; } QPushButton:disabled { background-color: #bdc3c7; }")
        self.play_btn.setEnabled(False)
        self.play_btn.clicked.connect(self.resume_scheduler)
        btn_layout.addWidget(self.play_btn)
        self.stop_btn = QPushButton("Stop")
        self.stop_btn.setStyleSheet("QPushButton { background-color: #e74c3c; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; } QPushButton:hover { background-color: #e74c3cdd; }")
        self.stop_btn.clicked.connect(self.pause_scheduler)
        btn_layout.addWidget(self.stop_btn)
        self.run_now_btn = QPushButton("Executar Agora")
        self.run_now_btn.setStyleSheet("QPushButton { background-color: #3498db; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; } QPushButton:hover { background-color: #3498dbdd; }")
        self.run_now_btn.clicked.connect(self.run_automation_now)
        btn_layout.addWidget(self.run_now_btn)
        layout.addLayout(btn_layout)
        exit_btn = QPushButton("Fechar Aplicativo")
        exit_btn.setStyleSheet("QPushButton { background-color: #95a5a6; color: white; border: none; padding: 10px; border-radius: 5px; font-weight: bold; } QPushButton:hover { background-color: #7f8c8d; }")
        exit_btn.clicked.connect(self.quit_application)
        layout.addWidget(exit_btn)
        self.setLayout(layout)
        
    def init_tray(self):
        self.tray_icon = QSystemTrayIcon(self)
        pixmap = self.style().standardPixmap(QStyle.SP_ComputerIcon)
        self.tray_icon.setIcon(QIcon(pixmap))
        tray_menu = QMenu()
        show_action = QAction("Mostrar", self)
        show_action.triggered.connect(self.show_window)
        tray_menu.addAction(show_action)
        tray_menu.addSeparator()
        self.tray_play_action = QAction("Play", self)
        self.tray_play_action.triggered.connect(self.resume_scheduler)
        self.tray_play_action.setEnabled(False)
        tray_menu.addAction(self.tray_play_action)
        self.tray_stop_action = QAction("Stop", self)
        self.tray_stop_action.triggered.connect(self.pause_scheduler)
        tray_menu.addAction(self.tray_stop_action)
        tray_menu.addSeparator()
        run_now_action = QAction("Executar Agora", self)
        run_now_action.triggered.connect(self.run_automation_now)
        tray_menu.addAction(run_now_action)
        tray_menu.addSeparator()
        exit_action = QAction("Sair", self)
        exit_action.triggered.connect(self.quit_application)
        tray_menu.addAction(exit_action)
        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.tray_activated)
        self.tray_icon.show()
        self.tray_icon.showMessage("Servcom Automation", "Aplicativo iniciado na bandeja. Agendado para 17:00 em dias uteis.", QSystemTrayIcon.Information, 3000)
        
    def tray_activated(self, reason):
        if reason == QSystemTrayIcon.DoubleClick:
            self.show_window()
            
    def show_window(self):
        self.show()
        self.raise_()
        self.activateWindow()
        
    def start_scheduler(self):
        self.scheduler = SchedulerThread()
        self.scheduler.trigger_signal.connect(self.run_automation_now)
        self.scheduler.start()
        self.update_status("Scheduler ativo - Aguardando 17:00 (Seg-Sex)")
        
    def pause_scheduler(self):
        if self.scheduler:
            self.scheduler.pause()
        self.is_scheduler_active = False
        self.play_btn.setEnabled(True)
        self.stop_btn.setEnabled(False)
        self.tray_play_action.setEnabled(True)
        self.tray_stop_action.setEnabled(False)
        self.update_status("Scheduler PAUSADO")
        
    def resume_scheduler(self):
        if self.scheduler:
            self.scheduler.resume()
        self.is_scheduler_active = True
        self.play_btn.setEnabled(False)
        self.stop_btn.setEnabled(True)
        self.tray_play_action.setEnabled(False)
        self.tray_stop_action.setEnabled(True)
        self.update_status("Scheduler ATIVO - Aguardando 17:00 (Seg-Sex)")
        
    def run_automation_now(self):
        if self.is_running:
            QMessageBox.warning(self, "Aviso", "Automacao ja esta em execucao!")
            return
        self.is_running = True
        self.run_now_btn.setEnabled(False)
        self.update_status("Executando automacao...")
        self.automation_worker = AutomationWorker()
        self.automation_worker.status_signal.connect(self.update_status)
        self.automation_worker.finished_signal.connect(self.automation_finished)
        self.automation_worker.start()
        
    def automation_finished(self, success, message):
        self.is_running = False
        self.run_now_btn.setEnabled(True)
        if success:
            self.update_status("Sucesso: {}".format(message))
            self.tray_icon.showMessage("Sucesso!", message, QSystemTrayIcon.Information, 5000)
        else:
            self.update_status("Erro: {}".format(message))
            self.tray_icon.showMessage("Erro", message, QSystemTrayIcon.Critical, 5000)
            
    def update_status(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.status_label.setText("[{}] {}".format(timestamp, message))
        
    def quit_application(self):
        reply = QMessageBox.question(self, 'Confirmar Saida', 'Deseja realmente fechar o Servcom Automation? O scheduler sera encerrado.', QMessageBox.Yes | QMessageBox.No, QMessageBox.No)
        if reply == QMessageBox.Yes:
            if self.scheduler:
                self.scheduler.stop()
            if self.automation_worker and self.automation_worker.isRunning():
                self.automation_worker.running = False
                self.automation_worker.wait(2000)
            self.tray_icon.hide()
            QApplication.quit()
            
    def closeEvent(self, event):
        event.ignore()
        self.hide()
        self.tray_icon.showMessage("Servcom Automation", "Aplicativo rodando em segundo plano.", QSystemTrayIcon.Information, 2000)

def add_to_startup():
    try:
        import winreg as reg
        exe_path = os.path.abspath(sys.argv[0])
        key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        key = reg.OpenKey(reg.HKEY_CURRENT_USER, key_path, 0, reg.KEY_SET_VALUE)
        reg.SetValueEx(key, "ServcomAutomation", 0, reg.REG_SZ, exe_path)
        reg.CloseKey(key)
        return True
    except Exception as e:
        print("Erro ao adicionar a inicializacao: {}".format(e))
        return False

def main():
    config_dir = os.path.join(os.path.dirname(__file__), "..", "config")
    flag_file = os.path.join(config_dir, "installed.flag")
    first_run = not os.path.exists(flag_file)
    if first_run:
        os.makedirs(config_dir, exist_ok=True)
        with open(flag_file, "w") as f:
            f.write("installed")
        if add_to_startup():
            print("Adicionado a inicializacao do Windows")
        app_temp = QApplication(sys.argv)
        msg = QMessageBox()
        msg.setWindowTitle("Servcom Automation - Instalacao")
        msg.setText("Instalacao Concluida!")
        msg.setInformativeText("O Servcom Automation foi configurado com sucesso.\n\nIniciara automaticamente com o Windows\nExecutara as 17:00 em dias uteis\nFicara minimizado na bandeja do sistema\n\nUse o icone na bandeja para controlar o aplicativo.")
        msg.setIcon(QMessageBox.Information)
        msg.exec_()
        del app_temp
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)
    window = ServcomAutomationApp()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()