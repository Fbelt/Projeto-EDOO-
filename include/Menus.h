#ifndef MENUS_H
#define MENUS_H

#include <string>
#include <vector>
#include "SchoolData.h"

using namespace std;

// ── Menus de cada perfil ───────────────────────────────────────────
void mainMenu(SchoolData& data);                         // escolha do perfil
void adminMenu(SchoolData& data);                        // Administrador / Secretaria
void teacherMenu(SchoolData& data, Teacher& teacher);    // Professor
void studentMenu(SchoolData& data, Student& student);    // Aluno

// ── Ajudas usadas por mais de um menu (MenuShared.cpp) ─────────────

// Mostram uma lista numerada e devolvem o item escolhido (nullptr = voltou)
Student* chooseStudent(vector<Student*>& list);
Teacher* chooseTeacher(vector<Teacher*>& list);
Discipline* chooseDiscipline(vector<Discipline*>& list);
ClassGroup* chooseGroup(vector<ClassGroup*> list);
Enrollment* chooseEnrollment(ClassGroup& group);

// Turmas de um aluno (onlyCurrent = true: só as que ainda não encerraram)
vector<ClassGroup*> groupsOfStudent(SchoolData& data, Student& s, bool onlyCurrent);

// Turmas de um professor
vector<ClassGroup*> groupsOfTeacher(SchoolData& data, Teacher& t);

// Telas de relatório
void showGroupReport(ClassGroup& group);                 // diário/relatório da turma
void showTranscript(SchoolData& data, Student& s);       // histórico escolar
void showTimetable(vector<ClassGroup*> groups);          // horário semanal
void showHelp();                                         // ajuda e regras

// Texto com as notas: "8.0 · 9.0 · PF 6.0"
string gradesText(Enrollment& e);

#endif
