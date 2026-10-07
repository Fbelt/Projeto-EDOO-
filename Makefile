# Para compilar: mingw32-make (Windows) ou make (Linux/Mac)
# Para rodar: ./servidor e abrir http://localhost:8080

# Servidor que liga o React (pasta web/) as classes do sistema.
CLASSES = $(wildcard src/*.cpp)

ifeq ($(OS),Windows_NT)
    NET = -lws2_32
else
    NET = -pthread
endif

all: servidor

servidor: sqlite3.o
	g++ -std=c++17 -Iinclude -Isqlite -Iapi api/server.cpp $(CLASSES) sqlite3.o $(NET) -o servidor

# O SQLite so precisa ser compilado uma vez
sqlite3.o:
	gcc -c sqlite/sqlite3.c -o sqlite3.o
