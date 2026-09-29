#include "ClassGroup.h"
#include "Discipline.h"
#include "FinalExamEnrollment.h"
#include "Student.h"

#include <iostream>
#include <stdexcept>

using namespace std;

// Guarda os dados da turma, que começa aberta.
ClassGroup::ClassGroup(string code, Discipline& discipline, Teacher* teacher,
                       string semester, string schedule, int capacity) {
    if (capacity <= 0) {
        throw invalid_argument("Limite de vagas deve ser maior que zero");
    }
    this->code = code;
    this->discipline = &discipline;
    this->teacher = teacher;
    this->semester = semester;
    this->schedule = schedule;
    this->capacity = capacity;
    this->finished = false;
}

string ClassGroup::getCode() const { return code; }
Discipline& ClassGroup::getDiscipline() const { return *discipline; }
Teacher* ClassGroup::getTeacher() const { return teacher; }
string ClassGroup::getSemester() const { return semester; }
string ClassGroup::getSchedule() const { return schedule; }
int ClassGroup::getCapacity() const { return capacity; }
bool ClassGroup::isFinished() const { return finished; }

// Monta uma lista com os ponteiros das matrículas.
vector<Enrollment*> ClassGroup::getEnrollments() const {
    vector<Enrollment*> result;
    for (int i = 0; i < (int)enrollments.size(); i++) {
        result.push_back(enrollments[i].get());
    }
    return result;
}

void ClassGroup::finish() { finished = true; }

// Confere as regras e cria a matrícula do tipo certo para a disciplina.
Enrollment& ClassGroup::enroll(Student& student) {
    if (finished) {
        throw runtime_error("Turma encerrada");
    }
    if (findEnrollment(student) != nullptr) {
        throw runtime_error("Aluno ja matriculado nesta turma");
    }
    if ((int)enrollments.size() >= capacity) {
        throw runtime_error("Turma sem vagas");
    }

    if (discipline->getHasFinalExam()) {
        enrollments.push_back(make_unique<FinalExamEnrollment>(student, *this));
    } else {
        enrollments.push_back(make_unique<Enrollment>(student, *this));
    }
    return *enrollments.back();
}

// Procura o aluno e apaga a matrícula dele.
bool ClassGroup::unenroll(Student& student) {
    for (int i = 0; i < (int)enrollments.size(); i++) {
        if (&enrollments[i]->getStudent() == &student) {
            enrollments.erase(enrollments.begin() + i);
            return true;
        }
    }
    return false;
}

// Percorre as matrículas comparando o endereço do aluno.
Enrollment* ClassGroup::findEnrollment(Student& student) const {
    for (int i = 0; i < (int)enrollments.size(); i++) {
        if (&enrollments[i]->getStudent() == &student) {
            return enrollments[i].get();
        }
    }
    return nullptr;
}

// Uma linha por aluno e, no final, média da turma e taxa de aprovação.
void ClassGroup::printReport() const {
    cout << "=== Turma " << code << " - " << discipline->getName() << " (" << semester << ") ===" << endl;

    double sum = 0;
    int approved = 0;
    for (int i = 0; i < (int)enrollments.size(); i++) {
        Enrollment* e = enrollments[i].get();
        string status = e->calculateStatus(); // polimorfismo: cada tipo usa sua regra
        cout << e->getStudent().getName() << " | media " << e->calculateAverage()
             << " | freq " << e->calculateAttendance() << "% | " << status << endl;
        sum += e->calculateAverage();
        if (status == "Aprovado") {
            approved++;
        }
    }

    if (enrollments.empty()) {
        cout << "Nenhum aluno matriculado." << endl;
        return;
    }
    cout << "Media da turma: " << sum / enrollments.size() << endl;
    cout << "Aprovados: " << approved << " de " << enrollments.size()
         << " (" << approved * 100.0 / enrollments.size() << "%)" << endl;
}

// Percorre todas as turmas e mostra as que o aluno cursou.
void printTranscript(Student& student, const vector<ClassGroup*>& allGroups) {
    cout << "=== Historico de " << student.getName() << " ===" << endl;
    for (int i = 0; i < (int)allGroups.size(); i++) {
        Enrollment* e = allGroups[i]->findEnrollment(student);
        if (e != nullptr) {
            cout << allGroups[i]->getSemester() << " | "
                 << allGroups[i]->getDiscipline().getName()
                 << " | media " << e->calculateAverage() << " | " << e->calculateStatus() << endl;
        }
    }
}
