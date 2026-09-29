#include "FinalExamEnrollment.h"
#include "ClassGroup.h"

using namespace std;

// Só repassa para o construtor da classe base.
FinalExamEnrollment::FinalExamEnrollment(Student& student, ClassGroup& classGroup)
    : Enrollment(student, classGroup) {}

// Aprovado na final se (média + final) / 2 >= 5.
string FinalExamEnrollment::calculateStatus() const {
    if (!classGroup->isFinished()) {
        return "Cursando";
    }
    if (calculateAttendance() < 75) {
        return "Reprovado por falta";
    }
    double average = calculateAverage();
    if (average >= 7) {
        return "Aprovado";
    }
    if (average < 3) {
        return "Reprovado por nota";
    }
    if (finalGrade < 0) {
        return "Em prova final";
    }
    if ((average + finalGrade) / 2 >= 5) {
        return "Aprovado";
    }
    return "Reprovado por nota";
}
