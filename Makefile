# Para compilar: mingw32-make (Windows) ou make (Linux/Mac)
# Para rodar: ./sistema

all: sqlite3.o
	g++ -std=c++17 -Iinclude -Isqlite src/*.cpp sqlite3.o -o sistema

# O SQLite so precisa ser compilado uma vez
sqlite3.o:
	gcc -c sqlite/sqlite3.c -o sqlite3.o

# ── Interface web (bonus) ──────────────────────────────────────────
# Servidor que liga o React (pasta web/) as classes do sistema.
# Usa as classes de src/, menos os arquivos do menu de terminal.
# Para rodar: ./servidor e abrir http://localhost:8080
CLASSES = $(filter-out src/main.cpp src/Menu%.cpp src/Ui.cpp src/Input.cpp, $(wildcard src/*.cpp))

ifeq ($(OS),Windows_NT)
    NET = -lws2_32
else
    NET = -pthread
endif

servidor: sqlite3.o
	g++ -std=c++17 -Iinclude -Isqlite -Iapi api/server.cpp $(CLASSES) sqlite3.o $(NET) -o servidor
