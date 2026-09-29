#include "Enrollment.h"
#include "ClassGroup.h"

#include <stdexcept>

using namespace std;

// Confere se a nota está entre 0 e 10.
void checkGrade(double grade) {
    if (grade < 0 || grade > 10) {
        throw invalid_argument("Nota deve estar entre 0 e 10");
    }
}

// Guarda o endereço do aluno e da turma. Começa sem prova final.
Enrollment::Enrollment(Student& student, ClassGroup& classGroup) {
    this->student = &student;
    this->classGroup = &classGroup;
    this->finalGrade = -1;
}

Enrollment::~Enrollment() {}

Student& Enrollment::getStudent() const { return *student; }
ClassGroup& Enrollment::getClassGroup() const { return *classGroup; }
vector<double> Enrollment::getGrades() const { return grades; }
vector<bool> Enrollment::getAttendance() const { return attendance; }
double Enrollment::getFinalGrade() const { return finalGrade; }

// Valida e adiciona a nota.
void Enrollment::addGrade(double grade) {
    checkGrade(grade);
    grades.push_back(grade);
}

// Valida e troca uma nota já lançada.
void Enrollment::setGrade(int index, double grade) {
    checkGrade(grade);
    if (index < 0 || index >= (int)grades.size()) {
        throw out_of_range("Avaliacao inexistente");
    }
    grades[index] = grade;
}

// Adiciona uma aula na lista de frequência.
void Enrollment::addAttendance(bool present) {
    attendance.push_back(present);
}

// Valida e guarda a nota da final.
void Enrollment::setFinalGrade(double grade) {
    checkGrade(grade);
    finalGrade = grade;
}

// Soma as notas e divide pela quantidade (0 se não tiver notas).
double Enrollment::calculateAverage() const {
    if (grades.empty()) {
        return 0;
    }
    double sum = 0;
    for (int i = 0; i < (int)grades.size(); i++) {
        sum += grades[i];
    }
    return sum / grades.size();
}

// Conta as presenças e calcula o percentual (100% se não houve aula).
double Enrollment::calculateAttendance() const {
    if (attendance.empty()) {
        return 100;
    }
    int presences = 0;
    for (int i = 0; i < (int)attendance.size(); i++) {
        if (attendance[i]) {
            presences++;
        }
    }
    return presences * 100.0 / attendance.size();
}

// Regra padrão: frequência >= 75% e média >= 7.
string Enrollment::calculateStatus() const {
    if (!classGroup->isFinished()) {
        return "Cursando";
    }
    if (calculateAttendance() < 75) {
        return "Reprovado por falta";
    }
    if (calculateAverage() >= 7) {
        return "Aprovado";
    }
    return "Reprovado por nota";
}
