#include <iostream>
#include "ClassGroup.h"
#include "FinalExamEnrollment.h"

using namespace std;

// Construtor: guarda os dados da turma
ClassGroup::ClassGroup(string c, Discipline* d, Teacher* t, string sem, string sch, int cap) {
    code = c;
    discipline = d;
    teacher = t;
    semester = sem;
    schedule = sch;
    capacity = cap;
    finished = false;
}

// Destrutor: apaga as matrículas que foram criadas com new
ClassGroup::~ClassGroup() {
    for (Enrollment* e : enrollments) {
        delete e;
    }
}

string ClassGroup::getCode() { return code; }
Discipline* ClassGroup::getDiscipline() { return discipline; }
Teacher* ClassGroup::getTeacher() { return teacher; }
string ClassGroup::getSemester() { return semester; }
string ClassGroup::getSchedule() { return schedule; }
int ClassGroup::getCapacity() { return capacity; }
bool ClassGroup::isFinished() { return finished; }
vector<Enrollment*> ClassGroup::getEnrollments() { return enrollments; }

// Encerra o semestre da turma
void ClassGroup::finish() { finished = true; }

// Matricula o aluno, se possível
bool ClassGroup::enroll(Student& s) {
    if (finished) {
        cout << "Turma encerrada" << endl;
        return false;
    }
    if (findEnrollment(s) != nullptr) {
        cout << "Aluno ja esta nesta turma" << endl;
        return false;
    }
    if (enrollments.size() >= capacity) {
        cout << "Turma sem vagas" << endl;
        return false;
    }

    // Cria o tipo de matrícula certo para a disciplina
    if (discipline->getHasFinalExam()) {
        enrollments.push_back(new FinalExamEnrollment(s));
    } else {
        enrollments.push_back(new Enrollment(s));
    }
    return true;
}

// Tira o aluno da turma
bool ClassGroup::unenroll(Student& s) {
    for (int i = 0; i < enrollments.size(); i++) {
        if (enrollments[i]->getStudent() == &s) {
            delete enrollments[i];
            enrollments.erase(enrollments.begin() + i);
            return true;
        }
    }
    cout << "Aluno nao esta nesta turma" << endl;
    return false;
}

// Procura a matrícula do aluno (nullptr = não encontrou)
Enrollment* ClassGroup::findEnrollment(Student& s) {
    for (Enrollment* e : enrollments) {
        if (e->getStudent() == &s) {
            return e;
        }
    }
    return nullptr;
}

// Situação do aluno: "Cursando" enquanto a turma não acaba
string ClassGroup::getStatus(Enrollment* e) {
    if (!finished) {
        return "Cursando";
    }
    return e->calculateStatus();  // polimorfismo: usa a regra certa
}

// Mostra os alunos da turma, a média da turma e quantos passaram
void ClassGroup::printReport() {
    cout << "Turma " << code << " - " << discipline->getName() << endl;

    if (enrollments.size() == 0) {
        cout << "Nenhum aluno" << endl;
        return;
    }

    double sum = 0;
    int approved = 0;
    for (Enrollment* e : enrollments) {
        cout << e->getStudent()->getName()
             << " | media " << e->calculateAverage()
             << " | freq " << e->calculateAttendance() << "%"
             << " | " << getStatus(e) << endl;

        sum += e->calculateAverage();
        if (getStatus(e) == "Aprovado") {
            approved++;
        }
    }

    cout << "Media da turma: " << sum / enrollments.size() << endl;
    cout << "Aprovados: " << approved << " de " << enrollments.size() << endl;
}

// Procura o aluno em todas as turmas e mostra as que ele cursou
void printTranscript(Student& s, vector<ClassGroup*> groups) {
    cout << "Historico de " << s.getName() << endl;
    for (ClassGroup* g : groups) {
        Enrollment* e = g->findEnrollment(s);
        if (e != nullptr) {
            cout << g->getSemester() << " | " << g->getDiscipline()->getName()
                 << " | media " << e->calculateAverage()
                 << " | " << g->getStatus(e) << endl;
        }
    }
}
