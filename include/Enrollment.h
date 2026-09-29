#ifndef ENROLLMENT_H
#define ENROLLMENT_H

#include <string>
#include <vector>

using namespace std;

class Student;
class ClassGroup;

// Matrícula: liga um aluno a uma turma e guarda notas e frequência.
class Enrollment {
protected:
    Student* student;
    ClassGroup* classGroup;
    vector<double> grades;     // notas de 0 a 10
    vector<bool> attendance;   // uma posição por aula: true = presente
    double finalGrade;         // nota da prova final (-1 = não fez)

public:
    // Cria a matrícula do aluno na turma.
    Enrollment(Student& student, ClassGroup& classGroup);
    // Destrutor virtual: a turma apaga as matrículas pelo ponteiro da classe base.
    virtual ~Enrollment();

    Student& getStudent() const;
    ClassGroup& getClassGroup() const;
    vector<double> getGrades() const;
    vector<bool> getAttendance() const;
    double getFinalGrade() const;

    // Lança uma nota (0 a 10).
    void addGrade(double grade);
    // Edita a nota da avaliação de posição "index" (a primeira é 0).
    void setGrade(int index, double grade);
    // Registra presença (true) ou falta (false) na próxima aula.
    void addAttendance(bool present);
    // Lança a nota da prova final (0 a 10).
    void setFinalGrade(double grade);

    // Média das notas.
    double calculateAverage() const;
    // Percentual de presença (0 a 100).
    double calculateAttendance() const;
    // Situação do aluno. É virtual: a subclasse com prova final muda a regra.
    virtual string calculateStatus() const;
};

#endif
