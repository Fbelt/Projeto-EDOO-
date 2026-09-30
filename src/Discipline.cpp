#include <iostream>
#include "Discipline.h"

using namespace std;

// Construtor: guarda os dados da disciplina
Discipline::Discipline(string c, string n, int w, string s, bool f) {
    code = c;
    name = n;
    workload = w;
    syllabus = s;
    hasFinalExam = f;
    teacher = nullptr;  // ainda sem professor
}

string Discipline::getCode() { return code; }
string Discipline::getName() { return name; }
int Discipline::getWorkload() { return workload; }
string Discipline::getSyllabus() { return syllabus; }
Teacher* Discipline::getTeacher() { return teacher; }
bool Discipline::getHasFinalExam() { return hasFinalExam; }

void Discipline::setName(string n) { name = n; }
void Discipline::setSyllabus(string s) { syllabus = s; }
void Discipline::setTeacher(Teacher* t) { teacher = t; }

// Só aceita carga horária positiva
void Discipline::setWorkload(int w) {
    if (w < 0) {
        cout << "Carga horaria invalida" << endl;
        return;
    }
    workload = w;
}
