#include "Discipline.h"

#include <stdexcept>

using namespace std;

// Cria a disciplina (o professor é definido depois com setTeacher).
Discipline::Discipline(string code, string name, int workload, string syllabus, bool hasFinalExam) {
    this->code = code;
    this->name = name;
    this->syllabus = syllabus;
    this->hasFinalExam = hasFinalExam;
    this->teacher = nullptr;
    setWorkload(workload);
}

string Discipline::getCode() const { return code; }
string Discipline::getName() const { return name; }
int Discipline::getWorkload() const { return workload; }
string Discipline::getSyllabus() const { return syllabus; }
Teacher* Discipline::getTeacher() const { return teacher; }
bool Discipline::getHasFinalExam() const { return hasFinalExam; }

void Discipline::setName(string name) { this->name = name; }
void Discipline::setSyllabus(string syllabus) { this->syllabus = syllabus; }
void Discipline::setTeacher(Teacher* teacher) { this->teacher = teacher; }

// Altera a carga horária, recusando valor negativo.
void Discipline::setWorkload(int workload) {
    if (workload < 0) {
        throw invalid_argument("Carga horaria nao pode ser negativa");
    }
    this->workload = workload;
}
