#include <iostream>
#include "Enrollment.h"

using namespace std;

// Construtor: começa sem notas e sem aulas
Enrollment::Enrollment(Student& s) {
    student = &s;  // guarda o endereço do aluno
    classes = 0;
    presences = 0;
    finalGrade = -1;
}

Enrollment::~Enrollment() {}

Student* Enrollment::getStudent() { return student; }
vector<double> Enrollment::getGrades() { return grades; }
int Enrollment::getClasses() { return classes; }
int Enrollment::getPresences() { return presences; }
double Enrollment::getFinalGrade() { return finalGrade; }

// Adiciona uma nota (de 0 a 10)
void Enrollment::addGrade(double g) {
    if (g < 0 || g > 10) {
        cout << "Nota invalida" << endl;
        return;
    }
    grades.push_back(g);
}

// Troca a nota de posição i (a primeira nota é a posição 0)
void Enrollment::setGrade(int i, double g) {
    if (i < 0 || i >= grades.size() || g < 0 || g > 10) {
        cout << "Nota invalida" << endl;
        return;
    }
    grades[i] = g;
}

// Registra uma aula: true = presente, false = falta
void Enrollment::addAttendance(bool present) {
    classes++;
    if (present) {
        presences++;
    }
}

// Lança a nota da prova final (de 0 a 10)
void Enrollment::setFinalGrade(double g) {
    if (g < 0 || g > 10) {
        cout << "Nota invalida" << endl;
        return;
    }
    finalGrade = g;
}

// Média = soma das notas / quantidade de notas
double Enrollment::calculateAverage() {
    if (grades.size() == 0) {
        return 0;
    }
    double sum = 0;
    for (double g : grades) {
        sum += g;
    }
    return sum / grades.size();
}

// Frequência em % = presenças / aulas * 100
double Enrollment::calculateAttendance() {
    if (classes == 0) {
        return 100;
    }
    return presences * 100.0 / classes;
}

// Regra normal: frequência >= 75% e média >= 7
string Enrollment::calculateStatus() {
    if (calculateAttendance() < 75) {
        return "Reprovado por falta";
    }
    if (calculateAverage() >= 7) {
        return "Aprovado";
    }
    return "Reprovado por nota";
}
