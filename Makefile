# Para compilar: mingw32-make (Windows) ou make (Linux)
# Para rodar: ./sistema

all: sqlite3.o
	g++ -Iinclude -Isqlite src/*.cpp sqlite3.o -o sistema

# O SQLite so precisa ser compilado uma vez
sqlite3.o:
	gcc -c sqlite/sqlite3.c -o sqlite3.o
