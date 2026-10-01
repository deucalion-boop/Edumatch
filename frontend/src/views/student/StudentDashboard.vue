<template>
  <main class="premium-dashboard">
    <template v-if="!hasFocusedDashboardSection">
      <section class="premium-hero" aria-labelledby="student-welcome-title">
        <div class="premium-hero__content">
          <span class="premium-eyebrow"><i class="fas fa-sparkles" aria-hidden="true"></i> My learning space</span>
          <h1 id="student-welcome-title">Welcome back, {{ displayName }}!</h1>
          <p>Everything you need for a focused and productive school day is right here.</p>
          <div class="premium-identity" aria-label="Student information">
            <span><i class="fas fa-calendar-day" aria-hidden="true"></i>{{ todayLabel }}</span>
            <span><i class="fas fa-users" aria-hidden="true"></i>{{ sectionLabel }}</span>
            <span><i class="fas fa-user-tie" aria-hidden="true"></i>{{ adviserLabel }}</span>
          </div>
          <p v-if="loadError" class="premium-alert" role="status">
            <i class="fas fa-circle-exclamation" aria-hidden="true"></i>{{ loadError }}
          </p>
        </div>
        <div class="premium-hero__visual" aria-hidden="true">
          <span class="visual-orbit visual-orbit--one"></span>
          <span class="visual-orbit visual-orbit--two"></span>
          <div class="visual-book"><i class="fas fa-book-open"></i></div>
          <span class="visual-chip visual-chip--top"><i class="fas fa-check"></i> Stay curious</span>
          <span class="visual-chip visual-chip--bottom"><i class="fas fa-bolt"></i> Keep growing</span>
        </div>
      </section>

      <section class="premium-overview" data-tour="dashboard-overview" aria-labelledby="overview-title">
        <div class="premium-section-heading premium-section-heading--compact">
          <div>
            <span class="premium-eyebrow">At a glance</span>
            <h2 id="overview-title">Your academic overview</h2>
          </div>
          <p>A quick pulse check on your learning journey.</p>
        </div>
        <div v-if="isInitialLoading" class="premium-summary-grid" aria-label="Loading academic overview">
          <article v-for="index in 4" :key="index" class="premium-summary-card premium-skeleton-card">
            <span class="skeleton skeleton--icon"></span>
            <span class="skeleton skeleton--short"></span>
            <span class="skeleton skeleton--value"></span>
            <span class="skeleton skeleton--line"></span>
          </article>
        </div>
        <div v-else class="premium-summary-grid">
          <article v-for="card in overviewCards" :key="card.label" class="premium-summary-card" :class="`premium-summary-card--${card.tone}`">
            <span class="premium-summary-card__icon"><i class="fas" :class="card.icon" aria-hidden="true"></i></span>
            <div class="premium-summary-card__copy">
              <span>{{ card.label }}</span>
              <strong class="premium-counter">{{ card.value }}</strong>
              <p>{{ card.note }}</p>
            </div>
            <span class="premium-summary-card__arrow" aria-hidden="true"><i class="fas fa-arrow-trend-up"></i></span>
          </article>
        </div>
      </section>

      <div v-if="isInitialLoading" class="premium-content-grid" aria-label="Loading dashboard content">
        <section class="premium-panel premium-panel--wide premium-skeleton-panel">
          <span class="skeleton skeleton--heading"></span>
          <span v-for="index in 3" :key="index" class="skeleton skeleton--task"></span>
        </section>
        <section class="premium-panel premium-skeleton-panel">
          <span class="skeleton skeleton--heading"></span>
          <span class="skeleton skeleton--illustration"></span>
        </section>
      </div>

      <template v-else>
        <div class="premium-content-grid">
          <section class="premium-panel premium-panel--wide" aria-labelledby="upcoming-work-title">
            <header class="premium-panel__header">
              <div>
                <span class="premium-eyebrow">Priority feed</span>
                <h2 id="upcoming-work-title">Upcoming work</h2>
                <p>Plan ahead and keep your most important tasks moving.</p>
              </div>
              <router-link to="/student/activities" class="premium-text-link">See all work <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
            </header>

            <div v-if="assignmentPreview.length" class="premium-timeline">
              <article v-for="item in assignmentPreview" :key="item.id" class="premium-task" :class="`premium-task--${item.dueTone}`">
                <div class="premium-task__rail" aria-hidden="true">
                  <span><i class="fas" :class="item.typeIcon"></i></span>
                </div>
                <div class="premium-task__body">
                  <div class="premium-task__topline">
                    <div>
                      <span class="premium-subject-label">{{ item.context }}</span>
                      <h3>{{ item.title }}</h3>
                    </div>
                    <span class="premium-due-badge" :class="`premium-due-badge--${item.dueTone}`">{{ item.dueLabel }}</span>
                  </div>
                  <div class="premium-task__chips">
                    <span><i class="fas fa-layer-group" aria-hidden="true"></i>{{ item.typeLabel }}</span>
                    <span :class="`premium-status--${item.stateTone}`"><i class="fas fa-circle" aria-hidden="true"></i>{{ item.stateLabel }}</span>
                    <span><i class="fas fa-user" aria-hidden="true"></i>{{ item.teacherName || 'Teacher' }}</span>
                    <span><i class="fas fa-calendar-alt" aria-hidden="true"></i>{{ item.deadlineText }}</span>
                  </div>
                  <div class="premium-task__progress">
                    <span><span :style="{ width: `${taskProgress(item)}%` }"></span></span>
                    <small>{{ taskProgress(item) }}% complete</small>
                  </div>
                </div>
              </article>
            </div>
            <div v-else class="premium-empty-state">
              <div class="premium-empty-state__art" aria-hidden="true">
                <span class="empty-check tw:inline:[color:#ffffff]! tw:inline:[-webkit-text-fill-color:#ffffff]!" >
                  <i class="fas fa-check tw:inline:[color:#ffffff]! tw:inline:[-webkit-text-fill-color:#ffffff]!" ></i>
                </span>
                <i class="fas fa-clipboard-list"></i>
              </div>
              <div>
                <span class="premium-eyebrow">You’re all caught up</span>
                <h3>No upcoming work right now</h3>
                <p>Enjoy the breathing room or explore your lessons to get a head start on what’s next.</p>
                <router-link to="/student/lessons" class="premium-button">Explore lessons <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
              </div>
            </div>
          </section>

          <aside class="premium-panel premium-focus-card" aria-labelledby="focus-title">
            <span class="premium-eyebrow">Learning pulse</span>
            <h2 id="focus-title">Today’s focus</h2>
            <div class="premium-focus-ring" :style="{ '--focus-progress': `${recommendationMeta.progress * 3.6}deg` }">
              <div><strong>{{ recommendationMeta.progress }}%</strong><span>Path ready</span></div>
            </div>
            <p>{{ recommendationSupportCopy }}</p>
            <div class="premium-focus-stats">
              <div><span>Current average</span><strong>{{ formatPercent(summary.averageScore) }}</strong></div>
              <div><span>Completed</span><strong>{{ summary.completedChallenges }}</strong></div>
            </div>
            <router-link :to="{ path: '/student/dashboard', query: { section: 'recommendations' } }" class="premium-button premium-button--soft">View progress <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
          </aside>
        </div>

        <section class="premium-panel premium-classes" aria-labelledby="my-classes-title">
          <header class="premium-panel__header">
            <div>
              <span class="premium-eyebrow">Course spaces</span>
              <h2 id="my-classes-title">My classes</h2>
              <p>Jump back into lessons, assignments, and progress for every subject.</p>
            </div>
            <router-link to="/student/lessons" class="premium-text-link">View all classes <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
          </header>

          <div v-if="subjects.length" class="premium-course-grid">
            <article v-for="(subject, index) in subjects.slice(0, 4)" :key="subject.id || index" class="premium-course-card" :class="`premium-course-card--${(index % 4) + 1}`">
              <div class="premium-course-card__banner">
                <span class="premium-course-card__icon"><i class="fas fa-book-open" aria-hidden="true"></i></span>
                <span class="premium-course-card__status"><i class="fas fa-circle" aria-hidden="true"></i>Active</span>
              </div>
              <div class="premium-course-card__body">
                <span class="premium-subject-label">{{ subject.code || subject.track || 'Course' }}</span>
                <h3>{{ subject.className || subject.name || 'Course' }}</h3>
                <p class="premium-course-card__teacher"><i class="fas fa-chalkboard-teacher" aria-hidden="true"></i>{{ subject.teacher?.name || 'Teacher' }}</p>
                <p class="premium-course-card__schedule"><i class="fas fa-clock" aria-hidden="true"></i>{{ courseSchedule(subject) }}</p>
                <div class="premium-course-card__metrics">
                  <span><strong>{{ subject.lessonCount || 0 }}</strong> lessons</span>
                  <span><strong>{{ subject.assessmentCount || 0 }}</strong> assignments</span>
                </div>
                <div class="premium-course-card__progress">
                  <div><span>Lesson progress</span><strong>{{ formatWholePercent(subject.performance?.progress || 0) }}</strong></div>
                  <span class="premium-progress-track" role="progressbar" :aria-valuenow="clamp(subject.performance?.progress || 0)" aria-valuemin="0" aria-valuemax="100">
                    <span :style="{ width: `${clamp(subject.performance?.progress || 0)}%` }"></span>
                  </span>
                </div>
                <div class="premium-course-card__actions">
                  <router-link to="/student/lessons"><i class="fas fa-play" aria-hidden="true"></i>Lessons</router-link>
                  <router-link to="/student/activities"><i class="fas fa-list-check" aria-hidden="true"></i>Activities</router-link>
                </div>
              </div>
            </article>
          </div>
          <div v-else class="premium-empty-state premium-empty-state--classes">
            <div class="premium-empty-state__art" aria-hidden="true"><i class="fas fa-graduation-cap"></i></div>
            <div>
              <span class="premium-eyebrow">Your classroom awaits</span>
              <h3>No approved classes yet</h3>
              <p>Visit Lessons to join a class and unlock course materials, activities, and progress tracking.</p>
              <router-link to="/student/lessons" class="premium-button">Find your classes <i class="fas fa-arrow-right" aria-hidden="true"></i></router-link>
            </div>
          </div>
          <div v-if="pendingSubjects.length" class="premium-pending-note" role="status">
            <i class="fas fa-hourglass-half" aria-hidden="true"></i>
            <span>{{ pendingSubjects.length }} enrollment request{{ pendingSubjects.length === 1 ? '' : 's' }} waiting for approval.</span>
          </div>
        </section>
      </template>
    </template>

    <section
      v-if="showGradesPanel"
      class="premium-panel premium-focus-panel premium-grades-panel"
      data-dashboard-section="grades"
      aria-labelledby="recent-results-title"
    >
      <header class="grades-premium-header">
        <div class="grades-premium-header__copy">
          <span class="premium-eyebrow"><i class="fas fa-chart-simple" aria-hidden="true"></i> Grades overview</span>
          <h1 id="recent-results-title">Grade Results</h1>
          <p>Track your academic performance, celebrate your progress, and discover where to focus next.</p>
        </div>
        <router-link to="/student/dashboard" class="grades-back-button">
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
          <span>Back to dashboard</span>
        </router-link>
      </header>
      <div v-if="isInitialLoading" class="grades-stat-grid" aria-label="Loading grade statistics">
        <article v-for="index in 4" :key="index" class="grades-stat-card grades-stat-card--skeleton">
          <span class="skeleton skeleton--icon"></span>
          <div><span class="skeleton skeleton--short"></span><span class="skeleton skeleton--value"></span></div>
        </article>
      </div>
      <div v-else class="grades-stat-grid" aria-label="Grade statistics">
        <article v-for="stat in gradeOverviewStats" :key="stat.label" class="grades-stat-card" :class="`grades-stat-card--${stat.tone}`">
          <span class="grades-stat-card__icon" aria-hidden="true"><i class="fas" :class="stat.icon"></i></span>
          <div>
            <span>{{ stat.label }}</span>
            <strong>{{ stat.value }}</strong>
            <small>{{ stat.note }}</small>
          </div>
        </article>
      </div>

      <div v-if="isInitialLoading" class="grades-content-skeleton" aria-label="Loading recent results">
        <span class="skeleton grades-content-skeleton__visual"></span>
        <div>
          <span class="skeleton skeleton--heading"></span>
          <span class="skeleton skeleton--line"></span>
          <span class="skeleton skeleton--line"></span>
          <span class="skeleton grades-content-skeleton__button"></span>
        </div>
      </div>
      <div v-else-if="hasGradesData" class="grades-results-dashboard">
        <aside class="grades-performance-card">
          <span class="grades-performance-card__eyebrow">Performance snapshot</span>
          <strong>{{ formatPercent(summary.averageScore) }}</strong>
          <p><i class="fas fa-arrow-trend-up" aria-hidden="true"></i>{{ summary.performanceTrend }}</p>
          <div class="grades-performance-card__track" role="progressbar" :aria-valuenow="clamp(summary.averageScore)" aria-valuemin="0" aria-valuemax="100">
            <span :style="{ width: `${clamp(summary.averageScore)}%` }"></span>
          </div>
          <small>Based on your published graded work</small>
        </aside>
        <div class="grades-results-feed">
          <div class="grades-results-feed__heading">
            <div><span class="premium-eyebrow">Latest activity</span><h2>Published scores</h2></div>
            <span class="grades-result-count">{{ gradesBadgeText }}</span>
          </div>
          <div class="premium-results-list">
          <article v-for="grade in recentGrades" :key="grade.key">
            <span class="premium-results-list__icon"><i class="fas fa-award" aria-hidden="true"></i></span>
            <div><h3>{{ grade.title }}</h3><p>{{ grade.context }} · {{ grade.time }}</p></div>
            <strong>{{ grade.score }}</strong>
          </article>
          </div>
        </div>
      </div>
      <div v-else class="grades-premium-empty">
        <div class="grades-premium-empty__visual" aria-hidden="true">
          <span class="grades-visual-orbit"></span>
          <div class="grades-visual-sheet">
            <i class="fas fa-chart-line"></i>
            <span><b></b><b></b><b></b></span>
          </div>
          <span class="grades-visual-badge"><i class="fas fa-star"></i></span>
        </div>
        <div class="grades-premium-empty__copy">
          <span class="premium-eyebrow">Your progress story starts here</span>
          <h2>No scores posted yet</h2>
          <p>Once your teachers publish graded quizzes, activities, or exams, your results and performance insights will appear here automatically.</p>
          <div class="grades-empty-guidance">
            <span><i class="fas fa-check-circle" aria-hidden="true"></i> Results update automatically</span>
            <span><i class="fas fa-shield-heart" aria-hidden="true"></i> Your grades stay private</span>
          </div>
          <router-link to="/student/activities" class="grades-primary-button">
            <span>Explore activities</span>
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </div>
      </div>

      <section v-if="!isInitialLoading && subjectGradeRecords.length" class="complete-grade-history" aria-labelledby="complete-grade-history-title">
        <header>
          <div><span class="premium-eyebrow">Official grading record</span><h2 id="complete-grade-history-title">Complete grading history</h2></div>
          <p>Final Grade is calculated after P1, P2, and P3 are all available.</p>
        </header>
        <div class="complete-grade-history__table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>P1</th><th>P2</th><th>P3</th><th>Final Grade</th></tr></thead>
            <tbody>
              <tr v-for="record in subjectGradeRecords" :key="record.subjectId">
                <th data-label="Subject"><strong>{{ record.subjectName }}</strong><small>{{ record.subjectCode || 'No subject code' }}</small></th>
                <td v-for="period in ['1st', '2nd', '3rd']" :key="`${record.subjectId}-${period}`" :data-label="period === '1st' ? 'P1' : period === '2nd' ? 'P2' : 'P3'">
                  <strong>{{ formatPeriodGrade(gradePeriod(record, period)?.grade) }}</strong>
                  <small v-if="gradePeriod(record, period)?.source?.examType">{{ formatLabel(gradePeriod(record, period).source.examType) }}</small>
                  <small v-else>Awaiting result</small>
                </td>
                <td class="is-final" data-label="Final Grade"><strong>{{ formatPeriodGrade(record.finalGrade) }}</strong><small>{{ record.finalGrade === null ? `${record.completedPeriods || 0}/3 periods` : 'Complete' }}</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section
      v-if="showRecommendationsPanel"
      class="premium-panel premium-focus-panel premium-pathway-panel"
      data-tour="dashboard-progress-insights"
      data-dashboard-section="recommendations"
      aria-labelledby="recommendation-title"
    >
      <header class="pathway-premium-header">
        <div class="pathway-premium-header__copy">
          <span class="premium-eyebrow"><i class="fas fa-compass" aria-hidden="true"></i> Personalized pathway</span>
          <h1 id="recommendation-title">Recommendation progress</h1>
          <p>Turn your assessment results into a clearer picture of the academic strand that fits your strengths.</p>
        </div>
        <router-link to="/student/dashboard" class="pathway-back-button">
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
          <span>Back to dashboard</span>
        </router-link>
      </header>

      <div v-if="isInitialLoading" class="pathway-loading" aria-label="Loading recommendation progress">
        <div><span class="skeleton skeleton--short"></span><span class="skeleton skeleton--heading"></span><span class="skeleton skeleton--line"></span><span class="skeleton skeleton--line"></span></div>
        <span class="skeleton pathway-loading__ring"></span>
      </div>

      <div v-else class="pathway-hero" data-tour="dashboard-strand-recommendation">
        <div class="pathway-hero__copy">
          <span class="pathway-status" :class="{ 'pathway-status--ready': recommendationMeta.ready }">
            <i class="fas" :class="recommendationMeta.ready ? 'fa-circle-check' : 'fa-sparkles'" aria-hidden="true"></i>
            {{ recommendationMeta.statusLabel }}
          </span>
          <h2>{{ recommendationHeadline }}</h2>
          <p>{{ recommendationSupportCopy }}</p>
          <div class="pathway-milestone">
            <span class="pathway-milestone__icon"><i class="fas fa-lightbulb" aria-hidden="true"></i></span>
            <div>
              <strong>{{ recommendationMeta.ready ? 'Your suggested pathway is ready' : 'Build a stronger recommendation' }}</strong>
              <p>{{ recommendationMeta.ready ? `Review why ${summary.recommendedStrand} matches your results.` : 'Complete more graded assessments to help EduMatch understand your strengths.' }}</p>
            </div>
          </div>
          <router-link v-if="!recommendationMeta.ready" to="/student/activities" class="pathway-primary-button">
            <span>Continue assessments</span>
            <i class="fas fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </div>

        <div class="pathway-progress-card">
          <span class="pathway-progress-card__label">{{ recommendationMeta.ready ? 'Recommendation ready' : 'Pathway completion' }}</span>
          <div
            class="pathway-progress-ring"
            :style="{ '--pathway-progress': `${recommendationMeta.progress * 3.6}deg` }"
            role="progressbar"
            :aria-valuenow="recommendationMeta.progress"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div><strong>{{ recommendationMeta.progress }}%</strong><span>Complete</span></div>
          </div>
          <strong class="pathway-progress-card__strand">{{ recommendationMeta.ready ? summary.recommendedStrand : 'Keep learning' }}</strong>
          <p>{{ recommendationMeta.ready ? 'Suggested strand based on your results' : 'Every graded result adds detail to your pathway.' }}</p>
        </div>
      </div>

      <div v-if="isInitialLoading" class="pathway-stat-grid" aria-label="Loading recommendation statistics">
        <article v-for="index in 6" :key="index" class="pathway-stat-card pathway-stat-card--skeleton">
          <span class="skeleton skeleton--icon"></span>
          <div><span class="skeleton skeleton--short"></span><span class="skeleton skeleton--value"></span></div>
        </article>
      </div>
      <div v-else class="pathway-stat-grid" aria-label="Recommendation statistics">
        <article v-for="stat in recommendationOverviewStats" :key="stat.label" class="pathway-stat-card" :class="`pathway-stat-card--${stat.tone}`">
          <span class="pathway-stat-card__icon" aria-hidden="true"><i class="fas" :class="stat.icon"></i></span>
          <div><span>{{ stat.label }}</span><strong>{{ stat.value }}</strong><small>{{ stat.note }}</small></div>
        </article>
      </div>

      <section v-if="!isInitialLoading" class="academic-progress-overview">
        <header><div><span class="premium-eyebrow">Learning completion</span><h2>Overall learning progress</h2></div><strong>{{ academicOverall.completionPercentage || 0 }}%</strong></header>
        <div class="academic-progress-track"><span :style="{ width: `${academicOverall.completionPercentage || 0}%` }"></span></div>
        <div class="academic-progress-counts">
          <span><i class="fas fa-book-open"></i><strong>{{ academicOverall.lessonsCompleted || 0 }}</strong> Lessons</span>
          <span><i class="fas fa-list-check"></i><strong>{{ academicOverall.activitiesCompleted || 0 }}</strong> Activities</span>
          <span><i class="fas fa-circle-question"></i><strong>{{ academicOverall.quizzesCompleted || 0 }}</strong> Quizzes</span>
          <span><i class="fas fa-file-circle-check"></i><strong>{{ academicOverall.examsCompleted || 0 }}</strong> Exams</span>
        </div>
      </section>

      <section v-if="!isInitialLoading && rankedStrandRecommendations.length" class="strand-ranking-section">
        <header>
          <div><span class="premium-eyebrow">AI strand recommendation</span><h2>Strand fit ranking</h2></div>
          <p>Ranked from the strongest to the lowest match using your graded subject performance.</p>
        </header>
        <ol class="strand-ranking-list">
          <li v-for="strand in rankedStrandRecommendations" :key="strand.name" :class="{ 'is-top-strand': strand.rank === 1 }">
            <div class="strand-rank-summary">
              <span class="strand-rank-number">#{{ strand.rank }}</span>
              <div class="strand-rank-name"><strong>{{ strand.name }}</strong><small>{{ strand.rank === 1 ? 'Top recommendation' : strand.fitLabel }}</small></div>
              <div class="strand-rank-score"><strong>{{ strand.score }}%</strong><span>{{ strand.fitLabel }}</span></div>
            </div>
            <div class="strand-fit-track" role="progressbar" :aria-label="`${strand.name} strand fit`" :aria-valuenow="strand.score" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: `${strand.score}%` }"></span></div>
            <details :open="strand.rank === 1">
              <summary><span>View subject basis</span><i class="fas fa-chevron-down" aria-hidden="true"></i></summary>
              <div v-if="strand.subjects.length" class="strand-subject-evidence">
                <article v-for="subject in strand.subjects" :key="`${strand.name}-${subject.subjectId || subject.subjectName}`">
                  <div><strong>{{ subject.subjectName }}</strong><small>{{ subject.subjectCode || subject.category }}</small></div>
                  <span :class="`is-${subject.tone}`">{{ subject.score }}% · {{ subject.label }}</span>
                </article>
              </div>
              <p v-else class="strand-no-evidence">More graded subject results are needed to explain this strand score.</p>
            </details>
          </li>
        </ol>
      </section>

      <section v-if="!isInitialLoading" class="subject-performance-section">
        <header><span class="premium-eyebrow">Subject performance</span><h2>Progress and academic results</h2><p>Completion and performance are shown separately. Empty categories are excluded and remaining weights are normalized.</p></header>
        <div v-if="academicSubjects.length" class="subject-performance-grid">
          <article v-for="subject in academicSubjects" :key="subject.subjectId" class="subject-performance-card">
            <div class="subject-performance-head"><div><strong>{{ subject.subjectName }}</strong><small>{{ subject.subjectCode || `${subject.evidenceCount} graded result(s)` }}</small></div><span :class="performanceTone(subject.performanceLevel)">{{ subject.performanceLevel }}</span></div>
            <div class="subject-score-pair"><div><span>Completion</span><strong>{{ subject.completionPercentage }}%</strong></div><div><span>Performance</span><strong>{{ subject.finalPercentage === null ? '—' : `${subject.finalPercentage}%` }}</strong></div></div>
            <div class="subject-progress-track"><span :style="{ width: `${subject.completionPercentage}%` }"></span></div>
            <div class="period-grade-grid" aria-label="Grading period history">
              <span>P1<strong>{{ formatPeriodGrade(subject.p1) }}</strong></span>
              <span>P2<strong>{{ formatPeriodGrade(subject.p2) }}</strong></span>
              <span>P3<strong>{{ formatPeriodGrade(subject.p3) }}</strong></span>
              <span class="is-final">Final Grade<strong>{{ formatPeriodGrade(subject.finalGrade) }}</strong></span>
            </div>
            <div class="category-score-grid"><span>Activity<strong>{{ formatAcademicValue(subject.activityAverage) }}</strong></span><span>Quiz<strong>{{ formatAcademicValue(subject.quizAverage) }}</strong></span><span>Exam<strong>{{ formatAcademicValue(subject.examAverage) }}</strong></span></div>
            <small class="subject-formula">Weights: A {{ subject.weights.activity }}% · Q {{ subject.weights.quiz }}% · E {{ subject.weights.exam }}%<br>{{ subject.hasSufficientData ? `${subject.evidenceCount} results · ranking eligible` : `${subject.evidenceCount}/${subject.minimumEvidenceCount} results · insufficient data` }}</small>
          </article>
        </div>
        <div v-else class="pathway-loading">No subject performance data is available yet.</div>
      </section>

      <section v-if="!isInitialLoading" class="recommendation-ranking-section">
        <header><span class="premium-eyebrow">Evidence-based ranking</span><h2>Academic strengths and priorities</h2></header>
        <div class="recommendation-highlight-grid">
          <article class="strength"><span>Top 1 Strength</span><strong>{{ strongestAcademicSubject ? `${strongestAcademicSubject.subjectName} — ${strongestAcademicSubject.finalPercentage}%` : 'More data needed' }}</strong><p>{{ subjectInsights.strengthRecommendation }}</p></article>
          <article class="priority"><span>Priority for Improvement</span><strong>{{ priorityAcademicSubject ? `${priorityAcademicSubject.subjectName} — ${priorityAcademicSubject.finalPercentage}%` : 'More data needed' }}</strong><p>{{ subjectInsights.improvementRecommendation }}</p></article>
        </div>
        <ol v-if="rankedAcademicSubjects.length" class="academic-ranking-list"><li v-for="subject in rankedAcademicSubjects" :key="subject.subjectId"><b>#{{ subject.rank }}</b><span>{{ subject.subjectName }}<small>{{ subject.evidenceCount }} graded results</small></span><strong>{{ subject.finalPercentage }}%</strong><em>{{ subject.performanceLevel }}</em></li></ol>
      </section>
    </section>
  </main>
</template>

<script>
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'

const NEW_WINDOW_MS = 72 * 60 * 60 * 1000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export default {
  name: 'StudentDashboard',
  data() {
    return {
      authStore: null,
      nowMs: Date.now(),
      isInitialLoading: true,
      loadError: '',
      scoredAverageScore: 0,
      lessons: [],
      assessments: [],
      finalizedSubmissions: [],
      activitySubmissions: [],
      subjects: [],
      pendingSubjects: [],
      recommendation: null,
      subjectInsights: {},
      studentContext: { section: null, adviser: null },
      studentContextLoaded: false,
      studentContextFailed: false,
      attendanceRecords: [],
      attendanceSummary: { totalRecords: 0, presentCount: 0, lateCount: 0, absentCount: 0, excusedCount: 0 },
      highlightResetTimer: null,
      refreshTimer: null,
      clockTimer: null
    }
  },
  computed: {
    displayName() {
      const user = this.authStore?.user || {}
      return String(user.name || user.displayName || user.username || 'Student').trim() || 'Student'
    },
    todayLabel() {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(this.nowMs))
    },
    sectionLabel() {
      if (!this.studentContextLoaded) return this.studentContextFailed ? 'Section unavailable' : 'Loading section...'
      return this.studentContext.section?.name ? `Section ${this.studentContext.section.name}` : 'Section not assigned'
    },
    adviserLabel() {
      if (!this.studentContextLoaded) return this.studentContextFailed ? 'Adviser unavailable' : 'Loading adviser...'
      return this.studentContext.adviser?.name ? `Adviser: ${this.studentContext.adviser.name}` : 'No adviser assigned'
    },
    summary() {
      const highest = this.finalizedSubmissions.reduce((max, item) => Math.max(max, Number(item.percentage || 0)), 0)
      return {
        averageScore: Number(Number(this.scoredAverageScore || 0).toFixed(2)),
        highestScore: Number(highest.toFixed(2)),
        completedChallenges: this.finalizedSubmissions.length,
        performanceTrend: this.getTrend(this.finalizedSubmissions),
        recommendedStrand: String(this.subjectInsights?.recommendedStrand?.name || this.recommendation?.recommendedStrand?.name || '').trim() || 'Not available yet'
      }
    },
    recommendationMeta() {
      const attempts = Number(this.subjectInsights?.assessmentAttemptsCount || this.finalizedSubmissions.length || 0)
      const raw = Number(this.subjectInsights?.recommendationProgressPercent ?? 0)
      const ready = Boolean(this.subjectInsights?.isRecommendationReady) || raw >= 100
      return { ready, progress: ready ? 100 : (attempts ? Math.max(1, Math.min(99, Math.round(raw))) : 0), statusLabel: ready ? 'Ready' : (attempts ? 'In Progress' : 'Not Started') }
    },
    recommendationHeadline() {
      return this.recommendationMeta.ready ? `Recommendation ready for ${this.summary.recommendedStrand}` : `Recommendation progress ${this.recommendationMeta.progress}%`
    },
    recommendationSupportCopy() {
      if (!this.recommendationMeta.progress) return 'Complete graded assessments to build your recommendation.'
      if (!this.recommendationMeta.ready) return 'Your recommendation keeps updating as you complete grading assessments.'
      return `Suggested strand: ${this.summary.recommendedStrand}`
    },
    activeDashboardSection() {
      return this.resolveDashboardSection(this.$route?.query?.section)
    },
    hasFocusedDashboardSection() {
      return Boolean(this.activeDashboardSection)
    },
    hasGradesData() {
      return this.recentGrades.length > 0
    },
    gradesBadgeText() {
      return this.hasGradesData
        ? `${this.recentGrades.length} result${this.recentGrades.length === 1 ? '' : 's'}`
        : 'Awaiting scores'
    },
    showGradesPanel() {
      return this.activeDashboardSection === 'grades'
    },
    showRecommendationsPanel() {
      return this.activeDashboardSection === 'recommendations'
    },
    activityMap() {
      return this.activitySubmissions.reduce((map, item) => {
        if (item.assessmentId) map[item.assessmentId] = item
        return map
      }, {})
    },
    assessmentMap() {
      return this.assessments.reduce((map, item) => {
        if (item.id) map[item.id] = item
        return map
      }, {})
    },
    assignmentPreview() {
      return this.assessments.map((item) => {
        const state = this.getTaskState(item)
        const due = this.getDueState(item, state.label)
        return {
          ...item,
          stateLabel: state.label,
          stateTone: state.tone,
          dueLabel: due.label,
          dueTone: due.tone,
          typeLabel: this.getTypeLabel(item),
          typeClass: this.getTypeClass(item),
          typeIcon: this.getTypeIcon(item),
          context: this.getContext(item),
          deadlineText: item.submissionDeadline ? this.formatDateTime(item.submissionDeadline) : 'No due date'
        }
      }).sort((a, b) => this.priority(a.dueTone) - this.priority(b.dueTone)).slice(0, 6)
    },
    recentGrades() {
      const gradingResults = Array.isArray(this.subjectInsights?.latestGradeResults) ? this.subjectInsights.latestGradeResults : []
      if (gradingResults.length) {
        return gradingResults.slice(0, 8).map((result, index) => ({
          key: `${result.subjectId || 'subject'}-${result.gradingPeriod || index}`,
          title: result.subjectName || result.title || 'Subject grade',
          context: `${this.periodLabel(result.gradingPeriod)}${result.examType ? ` · ${this.formatLabel(result.examType)}` : ''}`,
          score: this.formatPeriodGrade(result.grade),
          time: this.relative(result.gradedAt)
        }))
      }
      return this.finalizedSubmissions
        .filter((item) => !['ai_assisted', 'pending_teacher_review'].includes(String(item.scoringStatus || '').toLowerCase()))
        .slice(0, 5).map((item, index) => ({
        key: `${item.assessmentId || index}`,
        title: item.title || 'Assessment',
        context: this.getContext(this.assessmentMap[item.assessmentId] || { assessmentMode: item.assessmentMode }),
        score: this.getGrade(item),
        time: this.relative(item.submittedAt || item.createdAt)
      }))
    },
    announcementFeed() {
      const entries = []
      this.lessons.filter((item) => this.isNew(item.createdAt)).forEach((item, index) => {
        entries.push({ key: `lesson-${item.id || index}`, title: item.title || 'New lesson', message: `${item.teacherName || 'Teacher'} posted new lesson material.`, icon: 'fa-book-open', tone: 'info', time: this.relative(item.createdAt), at: new Date(item.createdAt || 0).getTime() || 0 })
      })
      this.assessments.filter((item) => this.isNew(item.createdAt)).forEach((item, index) => {
        entries.push({ key: `assessment-${item.id || index}`, title: item.title || 'New classwork', message: `${this.getTypeLabel(item)} added for ${this.getContext(item)}.`, icon: 'fa-clipboard-check', tone: 'warning', time: this.relative(item.createdAt), at: new Date(item.createdAt || 0).getTime() || 0 })
      })
      this.finalizedSubmissions.slice(0, 3).forEach((item, index) => {
        entries.push({ key: `submission-${item.assessmentId || index}`, title: item.title || 'Work completed', message: `You completed this task with ${this.getGrade(item)}.`, icon: 'fa-paper-plane', tone: 'success', time: this.relative(item.submittedAt || item.createdAt), at: new Date(item.submittedAt || item.createdAt || 0).getTime() || 0 })
      })
      return entries.sort((a, b) => b.at - a.at).slice(0, 8)
    },
    overviewCards() {
      return [
        { label: 'Upcoming Deadlines', value: String(this.assignmentPreview.filter((item) => ['urgent', 'warning', 'danger'].includes(item.dueTone)).length), note: 'Tasks needing attention this week', icon: 'fa-clock', tone: 'warning' },
        { label: 'Recent Grades', value: String(this.recentGrades.length), note: `${this.formatPercent(this.summary.averageScore)} current average`, icon: 'fa-chart-column', tone: 'info' },
        {
          label: 'Recommendations',
          value: this.recommendationMeta.ready ? 'Ready' : `${this.recommendationMeta.progress}%`,
          note: this.recommendationMeta.ready
            ? `Suggested strand: ${this.summary.recommendedStrand}`
            : 'Progress toward your strand recommendation',
          icon: 'fa-lightbulb',
          tone: this.recommendationMeta.ready ? 'success' : 'teal'
        },
        { label: 'Classes', value: String(this.subjects.length), note: this.subjects.length ? 'Organized into clear course cards' : 'Join a class to get started', icon: 'fa-book', tone: 'success' }
      ]
    },
    gradeOverviewStats() {
      const completedPeriods = this.subjectGradeRecords.reduce((total, record) => total + Number(record.completedPeriods || 0), 0)
      const requiredPeriods = this.subjectGradeRecords.length * 3
      const finalGrades = this.subjectGradeRecords.map((record) => record.finalGrade).filter((value) => value !== null && value !== undefined).map(Number)
      const highestGrade = finalGrades.length ? Math.max(...finalGrades) : null
      const completionRate = requiredPeriods
        ? Math.min(100, Math.round((completedPeriods / requiredPeriods) * 100))
        : null
      return [
        {
          label: 'Final Grade Average',
          value: this.finalGradeAverage === null ? '—' : this.formatPercent(this.finalGradeAverage),
          note: finalGrades.length ? `${finalGrades.length} completed subject grade${finalGrades.length === 1 ? '' : 's'}` : 'Requires P1, P2, and P3',
          icon: 'fa-chart-pie',
          tone: 'forest'
        },
        {
          label: 'Period Grades',
          value: String(completedPeriods),
          note: requiredPeriods ? `${completedPeriods} of ${requiredPeriods} records available` : 'No enrolled subjects',
          icon: 'fa-clipboard-check',
          tone: 'sage'
        },
        {
          label: 'Highest Final Grade',
          value: highestGrade === null ? '—' : this.formatPercent(highestGrade),
          note: highestGrade === null ? 'Awaiting complete grading history' : 'Highest completed subject',
          icon: 'fa-trophy',
          tone: 'gold'
        },
        {
          label: 'Completion Rate',
          value: completionRate === null ? '—' : `${completionRate}%`,
          note: requiredPeriods ? 'P1, P2, and P3 completion' : 'No grading records yet',
          icon: 'fa-circle-check',
          tone: 'teal'
        }
      ]
    },
    recommendationAssessmentStats() {
      const periodGrades = this.subjectGradeRecords.flatMap((record) => [record.p1, record.p2, record.p3])
        .filter((value) => value !== null && value !== undefined).map((value) => ({ percentage: Number(value) }))
      return [
        { label: 'Quiz', value: this.formatWholePercent(this.averagePercentageForRows(this.finalizedSubmissions.filter((item) => String(item?.assessmentMode || '').trim().toLowerCase() === 'quiz'))) },
        { label: 'Exam', value: this.formatWholePercent(this.averagePercentageForRows(periodGrades)) },
        { label: 'Activities', value: this.formatWholePercent(this.averagePercentageForRows(this.activitySubmissions)) }
      ]
    },
    recommendationOverviewStats() {
      const assessmentStats = this.recommendationAssessmentStats
      return [
        { ...assessmentStats[0], note: 'Quiz average', icon: 'fa-clipboard-question', tone: 'forest' },
        { ...assessmentStats[1], note: 'Exam average', icon: 'fa-file-circle-check', tone: 'sage' },
        { ...assessmentStats[2], note: 'Activity average', icon: 'fa-list-check', tone: 'teal' },
        { label: 'Completed', value: String(this.subjectGradeRecords.reduce((total, record) => total + Number(record.completedPeriods || 0), 0)), note: 'Subject period grades', icon: 'fa-circle-check', tone: 'success' },
        { label: 'Classes', value: String(this.subjects.length), note: 'Active learning spaces', icon: 'fa-book-open', tone: 'blue' },
        {
          label: 'Suggested Strand',
          value: this.summary.recommendedStrand,
          note: this.recommendationMeta.ready ? 'Recommendation ready' : 'Unlocks with progress',
          icon: 'fa-graduation-cap',
          tone: 'gold'
        }
      ]
    },
    academicOverall() {
      return this.subjectInsights?.overallLearningProgress || {}
    },
    academicSubjects() {
      return Array.isArray(this.subjectInsights?.subjectPerformance) ? this.subjectInsights.subjectPerformance : []
    },
    subjectGradeRecords() {
      return Array.isArray(this.subjectInsights?.gradeRecords) ? this.subjectInsights.gradeRecords : []
    },
    finalGradeAverage() {
      const grades = this.subjectGradeRecords.map((record) => record.finalGrade).filter((value) => value !== null && value !== undefined)
      return grades.length ? Number((grades.reduce((sum, value) => sum + Number(value || 0), 0) / grades.length).toFixed(2)) : null
    },
    rankedAcademicSubjects() {
      return Array.isArray(this.subjectInsights?.rankedSubjects) ? this.subjectInsights.rankedSubjects : []
    },
    rankedStrandRecommendations() {
      const scores = this.subjectInsights?.strandScores || this.recommendation?.strandScores || {}
      const categoryMap = {
        STEM: ['Math', 'Science', 'Technical'],
        HUMSS: ['English', 'AP', 'Science'],
        ABM: ['Business', 'Math', 'English'],
        TVL: ['Technical', 'Science', 'Math']
      }
      return Object.entries(scores)
        .map(([name, value]) => ({ name: String(name).toUpperCase(), score: this.clamp(Math.round(Number(value || 0))) }))
        .filter((strand) => strand.score > 0)
        .sort((left, right) => right.score - left.score)
        .map((strand, index) => {
          const relevantCategories = categoryMap[strand.name] || []
          const subjects = this.academicSubjects
            .map((subject) => {
              const score = this.academicSubjectScore(subject)
              const category = this.academicSubjectCategory(subject)
              return {
                ...subject,
                category,
                score,
                tone: score >= 85 ? 'high' : (score >= 75 ? 'moderate' : 'low'),
                label: score >= 85 ? 'High' : (score >= 75 ? 'Good' : 'Needs focus')
              }
            })
            .filter((subject) => relevantCategories.includes(subject.category) && subject.score !== null)
            .sort((left, right) => right.score - left.score)
          return {
            ...strand,
            rank: index + 1,
            fitLabel: strand.score >= 85 ? 'Excellent fit' : (strand.score >= 75 ? 'Strong fit' : (strand.score >= 65 ? 'Moderate fit' : 'Developing fit')),
            subjects
          }
        })
    },
    strongestAcademicSubject() { return this.subjectInsights?.strongestSubject || null },
    priorityAcademicSubject() { return this.subjectInsights?.prioritySubject || null }
  },
  watch: {
    '$route.query.section'() {
      this.scheduleDashboardSectionFocus()
    }
  },
  created() {
    this.clockTimer = window.setInterval(() => { this.nowMs = Date.now() }, 60000)
  },
  mounted() {
    this.authStore = useAuthStore()
    if (typeof window !== 'undefined') {
      window.addEventListener('student-dashboard-section-focus', this.handleDashboardSectionFocus)
    }
    this.fetchDashboardData()
    this.scheduleDashboardSectionFocus()
    this.refreshTimer = window.setInterval(() => this.fetchDashboardData(), 60000)
  },
  beforeUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('student-dashboard-section-focus', this.handleDashboardSectionFocus)
    }
    if (this.highlightResetTimer) window.clearTimeout(this.highlightResetTimer)
    if (this.refreshTimer) window.clearInterval(this.refreshTimer)
    if (this.clockTimer) window.clearInterval(this.clockTimer)
  },
  methods: {
    formatAcademicValue(value) {
      return value === null || value === undefined ? 'N/A' : `${Number(value).toFixed(1)}%`
    },
    formatPeriodGrade(value) {
      return value === null || value === undefined ? '—' : `${Number(value).toFixed(2)}%`
    },
    gradePeriod(record, period) {
      return (Array.isArray(record?.periods) ? record.periods : []).find((item) => item.period === period) || null
    },
    periodLabel(period) {
      return { '1st': 'P1', '2nd': 'P2', '3rd': 'P3' }[String(period || '').trim()] || 'Grading period'
    },
    formatLabel(value) {
      return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    },
    academicSubjectScore(subject) {
      const periodGrades = [subject?.p1, subject?.p2, subject?.p3]
        .filter((value) => value !== null && value !== undefined && Number.isFinite(Number(value))).map(Number)
      const periodAverage = periodGrades.length ? periodGrades.reduce((sum, value) => sum + value, 0) / periodGrades.length : null
      const value = subject?.finalGrade ?? periodAverage ?? subject?.finalPercentage ?? subject?.averageScore ?? subject?.progress
      if (value === null || value === undefined || !Number.isFinite(Number(value))) return null
      return Number(Number(value).toFixed(1))
    },
    academicSubjectCategory(subject) {
      const explicit = String(subject?.subjectCategory || '').trim()
      if (['Math', 'Science', 'English', 'AP', 'Business', 'Technical'].includes(explicit)) return explicit
      const name = String(subject?.subjectName || subject?.name || '').toLowerCase()
      if (/(math|algebra|geometry|calculus|statistics)/.test(name)) return 'Math'
      if (/(science|biology|chemistry|physics|research)/.test(name)) return 'Science'
      if (/(english|filipino|language|literature|reading|writing)/.test(name)) return 'English'
      if (/(araling|panlipunan|history|social|esp|pagpapakatao)/.test(name)) return 'AP'
      if (/(business|account|entrepreneur|economics|finance)/.test(name)) return 'Business'
      return 'Technical'
    },
    performanceTone(level) {
      const normalized = String(level || '').toLowerCase()
      if (normalized.includes('excellent') || normalized.includes('strong')) return 'is-strong'
      if (normalized.includes('needs')) return 'is-priority'
      if (normalized.includes('insufficient')) return 'is-insufficient'
      return 'is-developing'
    },
    resolveDashboardSection(section) {
      const normalized = String(section || '').trim().toLowerCase()
      if (normalized === 'recommendations') return 'recommendations'
      if (normalized === 'grades') return 'grades'
      return ''
    },
    focusDashboardSection(section) {
      const targetSection = this.resolveDashboardSection(section)
      if (!targetSection || typeof window === 'undefined') return
      const target = document.querySelector(`[data-dashboard-section="${targetSection}"]`)
      if (!(target instanceof HTMLElement)) return
      if (this.highlightResetTimer) {
        window.clearTimeout(this.highlightResetTimer)
        this.highlightResetTimer = null
      }
      document.querySelectorAll('.section-highlight').forEach((element) => element.classList.remove('section-highlight'))
      target.classList.remove('section-highlight')
      void target.offsetWidth
      target.classList.add('section-highlight')
      this.highlightResetTimer = window.setTimeout(() => {
        target.classList.remove('section-highlight')
        this.highlightResetTimer = null
      }, 1800)
      const targetTop = target.getBoundingClientRect().top + window.scrollY - 110
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
    },
    scheduleDashboardSectionFocus(section = this.$route?.query?.section) {
      const targetSection = this.resolveDashboardSection(section)
      if (!targetSection || typeof window === 'undefined') return
      this.$nextTick(() => {
        window.setTimeout(() => this.focusDashboardSection(targetSection), 120)
      })
    },
    handleDashboardSectionFocus(event) {
      this.scheduleDashboardSectionFocus(event?.detail?.section)
    },
    clamp(value) {
      const num = Number(value || 0)
      return Math.max(0, Math.min(100, Number.isFinite(num) ? num : 0))
    },
    uniqueBy(items, keyResolver) {
      const seen = new Set()
      return (Array.isArray(items) ? items : []).filter((item, index) => {
        const key = String(keyResolver(item, index) || '').trim()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
    resolveApiBaseUrl() {
      const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')
      if (!configured) return '/api'
      if (configured.endsWith('/api')) return configured
      return `${configured}/api`
    },
    getAuthConfig() {
      const token = this.authStore?.token || localStorage.getItem('edumatch_auth_token') || ''
      return { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    },
    isNew(value) {
      const time = new Date(value || 0).getTime()
      return Boolean(time) && (this.nowMs - time) <= NEW_WINDOW_MS
    },
    formatDate(value) {
      const parsed = new Date(value || 0)
      if (Number.isNaN(parsed.getTime())) return 'N/A'
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(parsed)
    },
    formatDateTime(value) {
      const parsed = new Date(value || 0)
      if (Number.isNaN(parsed.getTime())) return 'N/A'
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(parsed)
    },
    relative(value) {
      const time = new Date(value || 0).getTime()
      if (!time) return 'N/A'
      const diff = this.nowMs - time
      const mins = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      if (mins < 1) return 'Just now'
      if (mins < 60) return `${mins}m ago`
      if (hours < 24) return `${hours}h ago`
      if (days < 7) return `${days}d ago`
      return this.formatDate(value)
    },
    formatPercent(value) {
      return `${Number(value || 0).toFixed(2)}%`
    },
    formatWholePercent(value) {
      return `${Math.round(Number(value || 0))}%`
    },
    latestRowsByAssessment(rows = []) {
      const latest = new Map()
      rows.forEach((row, index) => {
        const key = String(row?.assessmentId || row?.id || `row-${index}`)
        if (!key) return
        const current = latest.get(key)
        const rowTime = new Date(row?.submittedAt || row?.gradedAt || row?.createdAt || 0).getTime() || 0
        const currentTime = current ? (new Date(current.submittedAt || current.gradedAt || current.createdAt || 0).getTime() || 0) : -1
        if (!current || rowTime >= currentTime) latest.set(key, row)
      })
      return [...latest.values()]
    },
    averagePercentageForRows(rows = []) {
      const percentages = this.latestRowsByAssessment(rows).reduce((values, row) => {
        const totalPoints = Number(row?.totalPoints || 0)
        const hasScoredData = totalPoints > 0 || row?.gradeValue !== null && row?.gradeValue !== undefined || Number(row?.percentage || 0) > 0
        const percentage = Number(row?.percentage ?? (totalPoints > 0 ? ((Number(row?.score || row?.gradeValue || 0) / totalPoints) * 100) : 0))
        if (!hasScoredData || !Number.isFinite(percentage)) return values
        values.push(Math.max(0, Math.min(100, percentage)))
        return values
      }, [])
      if (!percentages.length) return 0
      return Number((percentages.reduce((sum, value) => sum + value, 0) / percentages.length).toFixed(2))
    },
    getTypeLabel(item) {
      const mode = String(item?.assessmentMode || '').trim().toLowerCase()
      if (mode === 'grading_assessment') return 'Exam'
      if (mode === 'quiz') return 'Quiz'
      return 'Activity'
    },
    getTypeClass(item) {
      const mode = String(item?.assessmentMode || '').trim().toLowerCase()
      if (mode === 'grading_assessment') return 'warning'
      if (mode === 'quiz') return 'info'
      return 'teal'
    },
    getTypeIcon(item) {
      const mode = String(item?.assessmentMode || '').trim().toLowerCase()
      if (mode === 'grading_assessment') return 'fa-file-alt'
      if (mode === 'quiz') return 'fa-clipboard-list'
      return 'fa-book-open'
    },
    shouldShowClassworkDuePill(item) {
      const dueLabel = String(item?.dueLabel || '').trim().toLowerCase()
      const stateLabel = String(item?.stateLabel || '').trim().toLowerCase()
      if (!dueLabel) return false
      return dueLabel !== stateLabel
    },
    getContext(item) {
      return item?.lessonTitle || item?.lessonSubject || item?.strand || 'Direct class task'
    },
    getTaskState(item) {
      const activity = this.activityMap[item.id]
      const hasFinalizedSubmission = this.finalizedSubmissions.some((row) => row.assessmentId === item.id)
      if (String(item?.assessmentMode || '').trim().toLowerCase() === 'activity') {
        if (activity?.gradedAt || activity?.gradeValue !== null || (activity?.totalPoints > 0 && activity?.status === 'completed')) return { label: 'Graded', tone: 'success' }
        if (activity?.status === 'completed') return { label: 'Submitted', tone: 'info' }
        if (activity?.hasContent) return { label: 'Draft Saved', tone: 'violet' }
      }
      if (hasFinalizedSubmission) return { label: 'Completed', tone: 'success' }
      const deadline = new Date(item?.submissionDeadline || 0).getTime()
      if (deadline && deadline <= this.nowMs && !activity) return { label: 'Missing', tone: 'danger' }
      return { label: 'Ready', tone: 'teal' }
    },
    getDueState(item, stateLabel) {
      const deadline = new Date(item?.submissionDeadline || 0).getTime()
      if (!deadline) return { label: stateLabel, tone: 'info' }
      const diff = deadline - this.nowMs
      if (['Graded', 'Submitted'].includes(stateLabel)) return { label: stateLabel, tone: 'success' }
      if (diff <= 0) return { label: 'Past due', tone: 'danger' }
      if (diff <= 86400000) return { label: 'Due today', tone: 'urgent' }
      if (diff <= WEEK_MS) return { label: 'Due this week', tone: 'warning' }
      return { label: this.formatDate(item.submissionDeadline), tone: 'info' }
    },
    priority(tone) {
      return { danger: 0, urgent: 1, warning: 2, info: 3, teal: 4, success: 5 }[tone] ?? 6
    },
    taskProgress(item) {
      const state = String(item?.stateLabel || '').trim().toLowerCase()
      if (['graded', 'completed'].includes(state)) return 100
      if (state === 'submitted') return 90
      if (state === 'draft saved') return 55
      if (state === 'missing') return 12
      return 25
    },
    courseSchedule(subject) {
      const schedule = subject?.schedule
      if (typeof schedule === 'string' && schedule.trim()) return schedule.trim()
      if (Array.isArray(schedule) && schedule.length) {
        return schedule
          .map((entry) => typeof entry === 'string' ? entry : [entry?.day, entry?.time].filter(Boolean).join(' · '))
          .filter(Boolean)
          .join(', ')
      }
      return String(subject?.scheduleText || subject?.classSchedule || 'Schedule to be announced')
    },
    getGrade(item) {
      const total = Number(item?.totalPoints || 0)
      const score = Number(item?.score || 0)
      const pct = Number(item?.percentage || 0)
      if (item?.gradeValue !== null && item?.gradeValue !== undefined) return total > 0 ? `${item.gradeValue}/${total}` : String(item.gradeValue)
      if (total > 0) return `${score}/${total} (${pct.toFixed(0)}%)`
      if (pct > 0) return `${pct.toFixed(0)}%`
      return 'Reviewed'
    },
    getTrend(rows = []) {
      if (!Array.isArray(rows) || rows.length < 4) return 'Not enough data'
      const sorted = [...rows].sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0))
      const recent = sorted.slice(0, 3).map((row) => Number(row.percentage || 0))
      const previous = sorted.slice(3, 6).map((row) => Number(row.percentage || 0))
      if (!recent.length || !previous.length) return 'Not enough data'
      const recentAvg = recent.reduce((sum, value) => sum + value, 0) / recent.length
      const previousAvg = previous.reduce((sum, value) => sum + value, 0) / previous.length
      const delta = Number((recentAvg - previousAvg).toFixed(2))
      if (delta > 1) return `Improving (+${delta}%)`
      if (delta < -1) return `Needs focus (${delta}%)`
      return 'Stable'
    },
    attendanceTone(status) {
      const value = String(status || '').trim().toLowerCase()
      if (value === 'present') return 'success'
      if (value === 'late') return 'info'
      if (value === 'excused') return 'violet'
      if (value === 'absent') return 'danger'
      return 'teal'
    },
    async fetchRecommendation() {
      try {
        const user = this.authStore?.user || {}
        const studentId = String(user.id || user._id || '').trim()
        if (!studentId) return null
        const response = await axios.get(`${this.resolveApiBaseUrl()}/recommendation/${studentId}`, this.getAuthConfig())
        return response.data?.recommendation || null
      } catch (error) {
        throw error
      }
    },
    async fetchDashboardData() {
      try {
        this.loadError = ''
        const base = this.resolveApiBaseUrl()
        const auth = this.getAuthConfig()
        const responses = await Promise.allSettled([
          axios.get(`${base}/student/lessons`, auth),
          axios.get(`${base}/student/assessments`, auth),
          axios.get(`${base}/student/submissions/me`, auth),
          axios.get(`${base}/student/activity-submissions`, auth),
          axios.get(`${base}/student/subjects`, auth),
          this.fetchRecommendation(),
          axios.get(`${base}/student/attendance`, auth)
        ])

        const names = ['lessons', 'assessments', 'submissions', 'activities', 'subjects', 'recommendation', 'attendance']
        responses.forEach((result, index) => {
          if (result.status === 'rejected') console.error('Student dashboard request failed:', names[index], result.reason?.response?.status || result.reason?.message)
        })
        const [lessonsRes, assessmentsRes, submissionsRes, activityRes, subjectsRes, recommendationRes, attendanceRes] = responses.map(result => result.status === 'fulfilled' ? result.value : null)
        this.studentContextFailed = responses[4].status === 'rejected'
        if (responses.some(result => result.status === 'rejected')) this.loadError = 'Some dashboard information could not be refreshed. Showing the most recent information available.'
        const context = subjectsRes?.data?.studentContext
        if (context && Object.hasOwn(context, 'section') && Object.hasOwn(context, 'adviser')) {
          this.studentContext = context
          this.studentContextLoaded = true
          this.studentContextFailed = false
        } else {
          this.studentContextFailed = true
        }
        if (lessonsRes) this.lessons = this.uniqueBy(lessonsRes.data?.lessons || [], (item, index) => item.id || item._id || `${item.title || ''}-${index}`).map((item, index) => ({ id: String(item.id || item._id || `lesson-${index + 1}`), title: item.title || 'Untitled Lesson', teacherName: item.teacher?.name || '', createdAt: item.createdAt || item.postedAt || null }))
        if (assessmentsRes) this.assessments = this.uniqueBy(assessmentsRes.data?.assessments || [], (item, index) => item.id || item._id || `${item.title || ''}-${index}`).map((item, index) => ({ id: String(item.id || item._id || `assessment-${index + 1}`), title: item.title || 'Untitled Assessment', lessonTitle: item.lessonTitle || '', lessonSubject: item.lessonSubject || item.subject || '', teacherName: item.teacherName || item.createdBy?.name || '', assessmentMode: String(item.assessmentMode || 'activity').trim().toLowerCase(), strand: item.strand || item.track || '', submissionDeadline: item.submissionDeadline || null, createdAt: item.createdAt || null }))
        if (submissionsRes) this.finalizedSubmissions = (submissionsRes.data?.submissions || []).map((item, index) => ({ id: String(item._id || `submission-${index + 1}`), assessmentId: String(item.assessmentId?._id || item.assessmentId || ''), title: item.assessmentId?.title || item.assessmentTitle || 'Assessment', assessmentMode: String(item.assessmentId?.assessmentMode || item.assessmentMode || 'activity').trim().toLowerCase(), gradingPeriod: String(item.assessmentId?.gradingPeriod || item.gradingPeriod || '').trim(), score: Number(item.teacherAdjustedScore ?? item.gradeValue ?? item.score ?? 0), totalPoints: Number(item.totalPoints || 0), percentage: Number(item.totalPoints || 0) > 0 ? Number((((item.teacherAdjustedScore ?? item.gradeValue ?? item.score ?? 0) / item.totalPoints) * 100).toFixed(2)) : Number(item.percentage || 0), scoringStatus: String(item.scoringStatus || 'final').trim().toLowerCase(), submittedAt: item.submittedAt || item.createdAt || null, createdAt: item.createdAt || null }))
        if (activityRes) this.activitySubmissions = (activityRes.data?.submissions || []).map((item, index) => ({ id: String(item.id || `activity-${index + 1}`), assessmentId: String(item.assessmentId || ''), status: String(item.status || 'in_progress').trim().toLowerCase(), hasContent: Boolean(item.hasContent), gradedAt: item.gradedAt || null, submittedAt: item.submittedAt || null, createdAt: item.createdAt || null, gradeValue: item.gradeValue ?? null, score: Number(item.score || 0), totalPoints: Number(item.totalPoints || 0), percentage: Number(item.percentage || 0) }))
        if (subjectsRes) this.subjects = subjectsRes.data?.subjects || []
        if (subjectsRes) this.pendingSubjects = subjectsRes.data?.pendingSubjects || []

        const academicInsights = subjectsRes?.data?.insights || {}
        this.subjectInsights = {
          ...academicInsights,
          ...(recommendationRes || {}),
          subjectPerformance: academicInsights.subjectPerformance || recommendationRes?.subjectPerformance || [],
          overallLearningProgress: academicInsights.overallLearningProgress || {},
          rankedSubjects: academicInsights.rankedSubjects || [],
          strongestSubject: academicInsights.strongestSubject || null,
          prioritySubject: academicInsights.prioritySubject || null,
          strengthRecommendation: academicInsights.strengthRecommendation || '',
          improvementRecommendation: academicInsights.improvementRecommendation || ''
        }
        if (responses[5].status === 'fulfilled') this.recommendation = recommendationRes
        if (attendanceRes) this.attendanceRecords = attendanceRes.data?.records || []
        if (attendanceRes) this.attendanceSummary = attendanceRes.data?.summary || this.attendanceSummary
        if (submissionsRes) this.scoredAverageScore = Number(submissionsRes.data?.summary?.averageScore || 0)
      } catch (error) {
        console.error('Failed to fetch student dashboard data:', error)
        this.loadError = 'We could not refresh the latest dashboard data right now. Showing the most recent information available.'
      } finally {
        this.isInitialLoading = false
      }
    }
  }
}
</script>

<style scoped>
@reference "../../styles/tailwind.css";
.complete-grade-history { @apply tw:[margin-top:1rem]; @apply tw:[padding:1.1rem]; @apply tw:[border:1px_solid_#dfe8d8]; @apply tw:[border-radius:20px]; @apply tw:[background:#fff]; }
.complete-grade-history > header { @apply tw:flex; @apply tw:[align-items:end]; @apply tw:justify-between; @apply tw:[gap:1rem]; @apply tw:[margin-bottom:0.85rem]; }
.complete-grade-history h2 { @apply tw:[margin:0.25rem_0_0]; @apply tw:[color:#1e4307]; @apply tw:[font-size:1.15rem]; }
.complete-grade-history > header > p { @apply tw:[max-width:30rem]; @apply tw:[margin:0]; @apply tw:[color:#64748b]; @apply tw:[font-size:0.75rem]; @apply tw:text-right; }
.complete-grade-history__table-wrap { @apply tw:overflow-x-auto; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:14px]; }
.complete-grade-history table { @apply tw:w-full; @apply tw:[min-width:700px]; @apply tw:border-collapse; }
.complete-grade-history th,
.complete-grade-history td { @apply tw:[padding:0.75rem]; @apply tw:[border-bottom:1px_solid_#edf1e9]; @apply tw:[color:#334155]; @apply tw:text-center; }
.complete-grade-history thead th { @apply tw:[color:#60705c]; @apply tw:[background:#f7faf3]; @apply tw:[font-size:0.68rem]; @apply tw:uppercase; }
.complete-grade-history tbody th { @apply tw:[min-width:13rem]; @apply tw:text-left; }
.complete-grade-history tbody strong,
.complete-grade-history tbody small { @apply tw:block; }
.complete-grade-history tbody strong { @apply tw:[color:#1e4307]; @apply tw:[font-size:0.78rem]; }
.complete-grade-history tbody small { @apply tw:[margin-top:0.16rem]; @apply tw:[color:#94a3b8]; @apply tw:[font-size:0.6rem]; }
.complete-grade-history td.is-final { @apply tw:[background:#f0fdf4]; }
.complete-grade-history tbody tr:last-child th,
.complete-grade-history tbody tr:last-child td { @apply tw:[border-bottom:0]; }
.academic-progress-overview,
.strand-ranking-section,
.subject-performance-section,
.recommendation-ranking-section { @apply tw:[margin-top:1rem]; @apply tw:[padding:1.1rem]; @apply tw:[border:1px_solid_#dfe8d8]; @apply tw:[border-radius:20px]; @apply tw:[background:#fff]; }
.academic-progress-overview > header { @apply tw:flex; @apply tw:justify-between; @apply tw:[align-items:end]; @apply tw:[gap:1rem]; }
.academic-progress-overview h2,
.strand-ranking-section h2,
.subject-performance-section h2,
.recommendation-ranking-section h2 { @apply tw:[margin:0.25rem_0_0]; @apply tw:[color:#1e4307]; @apply tw:[font-size:1.15rem]; }
.academic-progress-overview > header > strong { @apply tw:[color:#4f8a35]; @apply tw:[font-size:1.7rem]; }
.academic-progress-track,
.subject-progress-track { @apply tw:[height:9px]; @apply tw:[margin:0.9rem_0]; @apply tw:overflow-hidden; @apply tw:[border-radius:999px]; @apply tw:[background:#e5eadf]; }
.academic-progress-track span,
.subject-progress-track span { @apply tw:block; @apply tw:h-full; @apply tw:[border-radius:inherit]; @apply tw:[background:linear-gradient(90deg,_#1e4307,_#8fc867)]; }
.period-grade-grid { @apply tw:grid; @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))]; @apply tw:[gap:0.4rem]; @apply tw:[margin-bottom:0.75rem]; }
.period-grade-grid span { @apply tw:grid; @apply tw:[gap:0.15rem]; @apply tw:[padding:0.55rem_0.35rem]; @apply tw:[color:#64748b]; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:10px]; @apply tw:[background:#fff]; @apply tw:[font-size:0.62rem]; @apply tw:text-center; }
.period-grade-grid strong { @apply tw:[color:#334155]; @apply tw:[font-size:0.76rem]; }
.period-grade-grid .is-final { @apply tw:[color:#3f6212]; @apply tw:[border-color:#bbd7a8]; @apply tw:[background:#f0fdf4]; @apply tw:[font-weight:800]; }
.period-grade-grid .is-final strong { @apply tw:[color:#1e4307]; }
.academic-progress-counts { @apply tw:grid; @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))]; @apply tw:[gap:0.65rem]; }
.academic-progress-counts span { @apply tw:[padding:0.65rem]; @apply tw:[border-radius:12px]; @apply tw:[background:#f7faf3]; @apply tw:[color:#52633e]; @apply tw:[font-size:0.75rem]; }
.academic-progress-counts i { @apply tw:[margin-right:0.4rem]; @apply tw:[color:#6c9b4c]; }
.academic-progress-counts strong { @apply tw:[margin-right:0.2rem]; @apply tw:[color:#1e4307]; }
.strand-ranking-section > header { @apply tw:flex; @apply tw:[align-items:end]; @apply tw:justify-between; @apply tw:[gap:1rem]; }
.strand-ranking-section > header > p { @apply tw:[max-width:32rem]; @apply tw:[margin:0]; @apply tw:[color:#64748b]; @apply tw:[font-size:0.76rem]; @apply tw:[line-height:1.5]; @apply tw:text-right; }
.strand-ranking-list { @apply tw:grid; @apply tw:[gap:0.7rem]; @apply tw:[margin:1rem_0_0]; @apply tw:[padding:0]; @apply tw:[list-style:none]; }
.strand-ranking-list > li { @apply tw:[padding:0.85rem]; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:15px]; @apply tw:[background:#fbfdf9]; }
.strand-ranking-list > li.is-top-strand { @apply tw:[border-color:#a7d68e]; @apply tw:[background:linear-gradient(135deg,_#f0fdf4,_#fbfef8)]; @apply tw:[box-shadow:0_10px_24px_rgba(30,_67,_7,_0.07)]; }
.strand-rank-summary { @apply tw:grid; @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto]; @apply tw:items-center; @apply tw:[gap:0.75rem]; }
.strand-rank-number { @apply tw:grid; @apply tw:[width:2.35rem]; @apply tw:[height:2.35rem]; @apply tw:place-items-center; @apply tw:[color:#fff]; @apply tw:[border-radius:11px]; @apply tw:[background:#4f8a35]; @apply tw:[font-size:0.75rem]; @apply tw:[font-weight:850]; }
.strand-rank-name { @apply tw:grid; @apply tw:[gap:0.1rem]; }
.strand-rank-name strong { @apply tw:[color:#1e4307]; @apply tw:[font-size:0.95rem]; }
.strand-rank-name small { @apply tw:[color:#64748b]; @apply tw:[font-size:0.66rem]; }
.strand-rank-score { @apply tw:grid; @apply tw:justify-items-end; }
.strand-rank-score strong { @apply tw:[color:#1e4307]; @apply tw:[font-size:1.15rem]; }
.strand-rank-score span { @apply tw:[color:#64748b]; @apply tw:[font-size:0.62rem]; @apply tw:[font-weight:700]; }
.strand-fit-track { @apply tw:[height:7px]; @apply tw:[margin:0.7rem_0_0.55rem]; @apply tw:overflow-hidden; @apply tw:[border-radius:999px]; @apply tw:[background:#e5eadf]; }
.strand-fit-track span { @apply tw:block; @apply tw:h-full; @apply tw:[border-radius:inherit]; @apply tw:[background:linear-gradient(90deg,_#1e4307,_#8fc867)]; }
.strand-ranking-list details { @apply tw:[border-top:1px_solid_#e6ece2]; }
.strand-ranking-list summary { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[padding-top:0.65rem]; @apply tw:[color:#456534]; @apply tw:cursor-pointer; @apply tw:[font-size:0.69rem]; @apply tw:[font-weight:800]; @apply tw:[list-style:none]; }
.strand-ranking-list summary::-webkit-details-marker { @apply tw:hidden; }
.strand-ranking-list details[open] summary i { @apply tw:[transform:rotate(180deg)]; }
.strand-ranking-list summary i { @apply tw:[transition:transform_180ms_ease]; }
.strand-subject-evidence { @apply tw:grid; @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(210px,_1fr))]; @apply tw:[gap:0.45rem]; @apply tw:[margin-top:0.65rem]; }
.strand-subject-evidence article { @apply tw:flex; @apply tw:items-center; @apply tw:justify-between; @apply tw:[gap:0.7rem]; @apply tw:[padding:0.6rem_0.7rem]; @apply tw:[border:1px_solid_#e5e7eb]; @apply tw:[border-radius:10px]; @apply tw:[background:#fff]; }
.strand-subject-evidence article > div { @apply tw:grid; @apply tw:[min-width:0]; }
.strand-subject-evidence article strong { @apply tw:overflow-hidden; @apply tw:[color:#334155]; @apply tw:[font-size:0.72rem]; @apply tw:text-ellipsis; @apply tw:whitespace-nowrap; }
.strand-subject-evidence article small { @apply tw:[color:#94a3b8]; @apply tw:[font-size:0.6rem]; }
.strand-subject-evidence article > span { @apply tw:flex-none; @apply tw:[padding:0.22rem_0.42rem]; @apply tw:[border-radius:999px]; @apply tw:[font-size:0.6rem]; @apply tw:[font-weight:800]; }
.strand-subject-evidence .is-high { @apply tw:[color:#166534]; @apply tw:[background:#dcfce7]; }
.strand-subject-evidence .is-moderate { @apply tw:[color:#854d0e]; @apply tw:[background:#fef3c7]; }
.strand-subject-evidence .is-low { @apply tw:[color:#991b1b]; @apply tw:[background:#fee2e2]; }
.strand-no-evidence { @apply tw:[margin:0.65rem_0_0]; @apply tw:[color:#64748b]; @apply tw:[font-size:0.7rem]; }
.subject-performance-section > header p { @apply tw:[margin:0.35rem_0_0.9rem]; @apply tw:[color:#64748b]; @apply tw:[font-size:0.8rem]; }
.subject-performance-grid { @apply tw:grid; @apply tw:[grid-template-columns:repeat(auto-fit,_minmax(255px,_1fr))]; @apply tw:[gap:0.8rem]; }
.subject-performance-card { @apply tw:[padding:0.9rem]; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:15px]; @apply tw:[background:#fbfdf9]; }
.subject-performance-head { @apply tw:flex; @apply tw:items-start; @apply tw:justify-between; @apply tw:[gap:0.7rem]; }
.subject-performance-head > div { @apply tw:grid; @apply tw:[gap:0.15rem]; }
.subject-performance-head > div strong { @apply tw:[color:#1e4307]; }
.subject-performance-head small { @apply tw:[color:#64748b]; @apply tw:[font-size:0.7rem]; }
.subject-performance-head > span { @apply tw:[padding:0.22rem_0.48rem]; @apply tw:[border-radius:999px]; @apply tw:[font-size:0.62rem]; @apply tw:[font-weight:800]; @apply tw:whitespace-nowrap; }
.subject-performance-head .is-strong { @apply tw:[background:#dcfce7]; @apply tw:[color:#166534]; }
.subject-performance-head .is-priority { @apply tw:[background:#fee2e2]; @apply tw:[color:#991b1b]; }
.subject-performance-head .is-developing { @apply tw:[background:#fef3c7]; @apply tw:[color:#92400e]; }
.subject-performance-head .is-insufficient { @apply tw:[background:#e2e8f0]; @apply tw:[color:#475569]; }
.subject-score-pair { @apply tw:grid; @apply tw:[grid-template-columns:1fr_1fr]; @apply tw:[gap:0.55rem]; @apply tw:[margin-top:0.8rem]; }
.subject-score-pair div { @apply tw:grid; @apply tw:[padding:0.55rem]; @apply tw:[border-radius:10px]; @apply tw:[background:#fff]; }
.subject-score-pair span { @apply tw:[color:#64748b]; @apply tw:[font-size:0.66rem]; }
.subject-score-pair strong { @apply tw:[color:#1e4307]; @apply tw:[font-size:1rem]; }
.category-score-grid { @apply tw:grid; @apply tw:[grid-template-columns:repeat(3,_1fr)]; @apply tw:[gap:0.35rem]; }
.category-score-grid span { @apply tw:grid; @apply tw:[gap:0.12rem]; @apply tw:[color:#64748b]; @apply tw:[font-size:0.63rem]; @apply tw:text-center; }
.category-score-grid strong { @apply tw:[color:#334155]; @apply tw:[font-size:0.75rem]; }
.subject-formula { @apply tw:block; @apply tw:[margin-top:0.7rem]; @apply tw:[color:#64748b]; @apply tw:[font-size:0.66rem]; @apply tw:[line-height:1.5]; }
.recommendation-highlight-grid { @apply tw:grid; @apply tw:[grid-template-columns:1fr_1fr]; @apply tw:[gap:0.8rem]; @apply tw:[margin-top:0.9rem]; }
.recommendation-highlight-grid article { @apply tw:[padding:0.9rem]; @apply tw:[border-radius:15px]; }
.recommendation-highlight-grid .strength { @apply tw:[border:1px_solid_#bbf7d0]; @apply tw:[background:#f0fdf4]; }
.recommendation-highlight-grid .priority { @apply tw:[border:1px_solid_#fecaca]; @apply tw:[background:#fff7f7]; }
.recommendation-highlight-grid span { @apply tw:[color:#64748b]; @apply tw:[font-size:0.65rem]; @apply tw:[font-weight:800]; @apply tw:uppercase; }
.recommendation-highlight-grid strong { @apply tw:block; @apply tw:[margin-top:0.3rem]; @apply tw:[color:#1e4307]; }
.recommendation-highlight-grid p { @apply tw:[margin:0.4rem_0_0]; @apply tw:[color:#475569]; @apply tw:[font-size:0.74rem]; @apply tw:[line-height:1.5]; }
.academic-ranking-list { @apply tw:grid; @apply tw:[gap:0.45rem]; @apply tw:[margin:0.9rem_0_0]; @apply tw:[padding:0]; @apply tw:[list-style:none]; }
.academic-ranking-list li { @apply tw:grid; @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto_auto]; @apply tw:items-center; @apply tw:[gap:0.7rem]; @apply tw:[padding:0.65rem_0.75rem]; @apply tw:[border:1px_solid_#e2e8f0]; @apply tw:[border-radius:12px]; }
.academic-ranking-list b { @apply tw:[color:#4f8a35]; }.academic-ranking-list span { @apply tw:grid; @apply tw:[color:#334155]; @apply tw:[font-weight:700]; }.academic-ranking-list small { @apply tw:[color:#64748b]; @apply tw:[font-size:0.65rem]; @apply tw:[font-weight:500]; }.academic-ranking-list em { @apply tw:[color:#64748b]; @apply tw:[font-size:0.68rem]; @apply tw:not-italic; }
@media (max-width: 720px) { .complete-grade-history > header { @apply tw:items-start; @apply tw:flex-col; }.complete-grade-history > header > p { @apply tw:text-left; }.academic-progress-counts { @apply tw:[grid-template-columns:1fr_1fr]; }.strand-ranking-section > header { @apply tw:items-start; @apply tw:flex-col; }.strand-ranking-section > header > p { @apply tw:text-left; }.strand-subject-evidence { @apply tw:[grid-template-columns:1fr]; }.recommendation-highlight-grid { @apply tw:[grid-template-columns:1fr]; }.academic-ranking-list li { @apply tw:[grid-template-columns:auto_1fr_auto]; }.academic-ranking-list em { @apply tw:[grid-column:2_/_-1]; } }

.student-dashboard-page {
  --ink: #12243a;
  --body: #4b5c70;
  --muted: #708094;
  --border: rgba(148, 163, 184, 0.2);
  --panel: rgba(255, 255, 255, 0.95);
  --shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
  @apply tw:grid;
  @apply tw:[gap:1rem];
  @apply tw:[font-family:"Inter",_-apple-system,_BlinkMacSystemFont,_"Segoe_UI",_Roboto,_sans-serif];
}

.hero,
.panel,
.summary-card {
  @apply tw:[border:1px_solid_var(--border)];
  @apply tw:[border-radius:24px];
  @apply tw:[background:var(--panel)];
  @apply tw:[box-shadow:var(--shadow)];
}

.hero {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:1rem];
  @apply tw:[padding:1.15rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[background:linear-gradient(135deg,_rgba(30,_67,_7,_0.18)_0%,_rgba(255,_213,_66,_0.22)_42%,_rgba(187,_255,_89,_0.2)_100%)_padding-box,______linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box];
}

.hero .hero-subheader {
  @apply tw:[color:#ffffff]!;
}

.hero .hero-subtitle {
  @apply tw:[color:#ffffff]!;
}

.hero .hero-copy p {
  @apply tw:[color:#ffffff];
}

.hero-copy,
.panel,
.summary-card,
.course-card,
.item-card,
.mini-card {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

.eyebrow {
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
  @apply tw:[color:#2563eb];
}

.eyebrow.light {
  @apply tw:[color:rgba(255,_255,_255,_0.86)];
}

.hero-subheader,
.panel-subheader {
  @apply tw:[margin:0];
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.hero-subtitle,
.panel-subtitle {
  @apply tw:[max-width:62ch];
}

.hero-copy h2,
.panel h3,
.summary-value,
.insight-hero h4 {
  @apply tw:[margin:0];
  @apply tw:[color:var(--ink)];
}

.hero-copy h2 {
  @apply tw:[max-width:12ch];
  @apply tw:[font-size:clamp(1.7rem,_3vw,_2.3rem)];
  @apply tw:[line-height:1.05];
  @apply tw:[letter-spacing:-0.04em];
}

.hero-copy p,
.panel p,
.feed-copy p {
  @apply tw:[margin:0];
  @apply tw:[color:var(--body)];
  @apply tw:[font-size:0.88rem];
  @apply tw:[line-height:1.6];
}

.row {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
}

.spread {
  @apply tw:justify-between;
}

.wrap {
  @apply tw:flex-wrap;
}

.chip-row,
.meta-row {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.55rem_0.8rem];
}

.overview-section,
.panel-heading {
  @apply tw:grid;
  @apply tw:[gap:0.35rem];
}

.chip,
.pill {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[min-height:32px];
  @apply tw:[padding:0.35rem_0.75rem];
  @apply tw:[border-radius:999px];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:800];
}

.chip {
  @apply tw:[background:rgba(255,_255,_255,_0.82)];
  @apply tw:[border:1px_solid_rgba(191,_219,_254,_0.7)];
  @apply tw:[color:var(--body)];
}

.hero .chip {
  @apply tw:[background:rgba(255,_252,_236,_0.88)];
  @apply tw:[border-color:rgba(169,_213,_95,_0.7)];
  @apply tw:[color:#3f4c1d];
}

.hero .chip i {
  @apply tw:[color:#5d7a14];
}

.success { @apply tw:[background:#ecfff1]; @apply tw:[color:#15803d]; }
.warning { @apply tw:[background:#fff7e7]; @apply tw:[color:#b45309]; }
.info { @apply tw:[background:#eaf1ff]; @apply tw:[color:#2563eb]; }
.teal { @apply tw:[background:#e8fffb]; @apply tw:[color:#0f766e]; }
.violet { @apply tw:[background:#f5f0ff]; @apply tw:[color:#6d28d9]; }
.danger,
.urgent { @apply tw:[background:#fff1ea]; @apply tw:[color:#c2410c]; }

.alert-copy,
.pending-note,
.empty-state,
.simple-card,
.item-card,
.course-card,
.feed-item,
.mini-card {
  @apply tw:[border:1px_solid_rgba(226,_232,_240,_0.95)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:#ffffff];
}

.alert-copy,
.pending-note,
.empty-state {
  @apply tw:flex;
  @apply tw:[gap:0.6rem];
  @apply tw:[padding:0.85rem_1rem];
}

.alert-copy {
  @apply tw:[color:#c2410c];
  @apply tw:[background:#fff7ed];
  @apply tw:[border-color:rgba(251,_146,_60,_0.38)];
}

.panel-link {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[min-height:40px];
  @apply tw:[padding:0.65rem_0.95rem];
  @apply tw:[border-radius:14px];
  @apply tw:[border:1px_solid_rgba(37,_99,_235,_0.18)];
  @apply tw:[background:rgba(37,_99,_235,_0.08)];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:800];
  @apply tw:[text-decoration:none];
  @apply tw:cursor-pointer;
}

.panel.classwork-panel {
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:0.95rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#ffffff_100%)_padding-box,______linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box];
}

.panel-head.classwork-panel-head {
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
}

.classwork-panel-heading {
  @apply tw:[gap:0.55rem];
}

.classwork-panel-heading .panel-subheader {
  @apply tw:[color:#4f6314];
}

.classwork-panel-heading .panel-subtitle {
  @apply tw:[color:#4d6120];
}

.classwork-title-row {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.6rem];
}

.classwork-title-row h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
}

.classwork-panel-link {
  @apply tw:self-start;
  @apply tw:[gap:0.45rem];
  @apply tw:[background:linear-gradient(135deg,_rgba(30,_67,_7,_0.14)_0%,_rgba(95,_116,_24,_0.12)_100%)];
  @apply tw:[border-color:rgba(30,_67,_7,_0.34)];
  @apply tw:[color:#1e4307];
  @apply tw:[box-shadow:0_10px_20px_rgba(30,_67,_7,_0.08)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_border-color_0.2s_ease];
}

.classwork-panel-link:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#1e4307];
  @apply tw:[color:#163304];
  @apply tw:[box-shadow:0_16px_28px_rgba(30,_67,_7,_0.14)];
}

.classwork-list {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:0.6rem];
}

.classwork-card {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[gap:0.65rem];
  @apply tw:[align-content:start];
  @apply tw:min-h-full;
  @apply tw:[padding:0.9rem];
  @apply tw:[border-radius:20px];
  @apply tw:overflow-hidden;
  @apply tw:[box-shadow:0_12px_24px_rgba(15,_23,_42,_0.06)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_border-color_0.2s_ease];
}

.classwork-card:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[box-shadow:0_22px_38px_rgba(15,_23,_42,_0.1)];
}

.item-card.classwork-card.warning,
.item-card.classwork-card.urgent {
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(251,_191,_36,_0.14),_transparent_32%),______linear-gradient(180deg,_#ffffff_0%,_#fffaf0_100%)];
}

.item-card.classwork-card.danger {
  @apply tw:[border-color:rgba(251,_146,_60,_0.28)];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(251,_146,_60,_0.16),_transparent_34%),______linear-gradient(180deg,_#ffffff_0%,_#fff8f4_100%)];
}

.item-card.classwork-card.success {
  @apply tw:[border-color:rgba(74,_222,_128,_0.24)];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(74,_222,_128,_0.14),_transparent_32%),______linear-gradient(180deg,_#ffffff_0%,_#f4fff8_100%)];
}

.classwork-card-top,
.classwork-card-top-main,
.classwork-badge-row {
  @apply tw:grid;
}

.classwork-card-top {
  @apply tw:[grid-template-columns:minmax(0,_1fr)_auto];
  @apply tw:[gap:0.65rem];
  @apply tw:[align-items:start];
}

.classwork-card-top-main {
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.7rem];
  @apply tw:items-center;
}

.classwork-card-icon {
  @apply tw:[width:44px];
  @apply tw:[height:44px];
  @apply tw:[border-radius:15px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(226,_232,_240,_0.95)];
  @apply tw:[font-size:1rem];
}

.classwork-card-icon.warning {
  @apply tw:[background:#fff7e7];
  @apply tw:[color:#b45309];
}

.classwork-card-icon.info {
  @apply tw:[background:#eaf1ff];
  @apply tw:[color:#2563eb];
}

.classwork-card-icon.teal {
  @apply tw:[background:#e8fffb];
  @apply tw:[color:#0f766e];
}

.classwork-card-top-copy {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:0.2rem];
}

.classwork-card-top-copy h4 {
  @apply tw:[margin:0];
  @apply tw:[font-size:0.98rem];
  @apply tw:[line-height:1.22];
}

.classwork-card-top-copy p {
  @apply tw:[margin:0];
  @apply tw:[color:var(--body)];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.45];
}

.classwork-badge-row {
  @apply tw:[grid-template-columns:repeat(2,_max-content)];
  @apply tw:[gap:0.45rem];
}

.classwork-due-pill {
  @apply tw:[align-self:start];
  @apply tw:[justify-self:end];
}

.classwork-meta-row {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.45rem];
}

.classwork-meta-chip {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.42rem];
  @apply tw:[min-height:32px];
  @apply tw:[padding:0.34rem_0.62rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_rgba(226,_232,_240,_0.95)];
  @apply tw:[background:rgba(255,_255,_255,_0.86)];
  @apply tw:[color:var(--body)];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
}

.classwork-empty-state {
  @apply tw:[min-height:220px];
  @apply tw:grid;
  @apply tw:justify-items-center;
  @apply tw:content-center;
  @apply tw:[gap:0.9rem];
  @apply tw:[padding:1.35rem_1.2rem];
  @apply tw:text-center;
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(37,_99,_235,_0.08),_transparent_34%),______linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)];
}

.classwork-empty-icon {
  @apply tw:[width:68px];
  @apply tw:[height:68px];
  @apply tw:[border-radius:22px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:linear-gradient(135deg,_#f4f7d8_0%,_#eef6c0_100%)];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(169,_213,_95,_0.55)];
  @apply tw:[color:#4f6314];
  @apply tw:[font-size:1.35rem];
}

.classwork-empty-copy {
  @apply tw:grid;
  @apply tw:justify-items-center;
  @apply tw:[gap:0.28rem];
  @apply tw:[max-width:30rem];
}

.classwork-empty-label {
  @apply tw:[color:#5f7418];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.08em];
  @apply tw:uppercase;
}

.classwork-empty-copy h4 {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:1.02rem];
  @apply tw:[line-height:1.3];
}

.classwork-empty-copy p {
  @apply tw:[margin:0];
  @apply tw:[color:#4d6120];
  @apply tw:[font-size:0.88rem];
  @apply tw:[line-height:1.6];
  @apply tw:text-center;
}

.panel.course-directory-panel {
  @apply tw:[gap:0.8rem];
  @apply tw:[padding:0.95rem];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#ffffff_100%)_padding-box,______linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box];
}

.panel-head.course-directory-head {
  @apply tw:items-center;
  @apply tw:[gap:0.7rem];
}

.course-directory-heading {
  @apply tw:[gap:0.5rem];
}

.course-directory-heading .panel-subheader {
  @apply tw:[color:#4f6314];
}

.course-directory-heading .panel-subtitle {
  @apply tw:[color:#4d6120];
}

.course-directory-title-row {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.6rem];
}

.course-directory-title-row h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
}

.course-directory-link {
  @apply tw:self-start;
  @apply tw:[gap:0.45rem];
  @apply tw:[background:linear-gradient(135deg,_rgba(30,_67,_7,_0.14)_0%,_rgba(95,_116,_24,_0.12)_100%)];
  @apply tw:[border-color:rgba(30,_67,_7,_0.34)];
  @apply tw:[color:#1e4307];
  @apply tw:[box-shadow:0_10px_20px_rgba(30,_67,_7,_0.08)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_border-color_0.2s_ease];
}

.course-directory-link:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#1e4307];
  @apply tw:[color:#163304];
  @apply tw:[box-shadow:0_15px_28px_rgba(30,_67,_7,_0.14)];
}

.course-directory-panel .course-grid {
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.7rem];
}

.course-card.course-directory-card {
  @apply tw:grid;
  @apply tw:[gap:0.7rem];
  @apply tw:[padding:0.9rem];
  @apply tw:[border-radius:20px];
  @apply tw:[border-color:rgba(169,_213,_95,_0.42)];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(255,_213,_66,_0.12),_transparent_34%),______linear-gradient(180deg,_#fffef8_0%,_#f9fce8_100%)];
  @apply tw:[box-shadow:0_12px_24px_rgba(30,_67,_7,_0.06)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_border-color_0.2s_ease];
}

.course-card.course-directory-card:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[box-shadow:0_20px_34px_rgba(30,_67,_7,_0.1)];
}

.course-card-top,
.course-card-heading,
.course-card-copy {
  @apply tw:grid;
}

.course-card-top {
  @apply tw:[grid-template-columns:minmax(0,_1fr)_auto];
  @apply tw:[gap:0.7rem];
  @apply tw:[align-items:start];
}

.course-card-heading {
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.72rem];
  @apply tw:items-center;
}

.course-card-icon {
  @apply tw:[width:46px];
  @apply tw:[height:46px];
  @apply tw:[border-radius:16px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[background:linear-gradient(135deg,_#f4f7d8_0%,_#eef6c0_100%)];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(169,_213,_95,_0.55)];
  @apply tw:[color:#4f6314];
  @apply tw:[font-size:1rem];
}

.course-card-copy {
  @apply tw:[min-width:0];
  @apply tw:[gap:0.22rem];
}

.course-card-copy h4 {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:1rem];
  @apply tw:[line-height:1.22];
}

.course-card-copy p {
  @apply tw:[margin:0];
  @apply tw:[color:#637227];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.04em];
  @apply tw:uppercase;
}

.course-status-pill {
  @apply tw:[align-self:start];
}

.course-teacher-row {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.48rem];
  @apply tw:w-fit;
  @apply tw:[min-height:32px];
  @apply tw:[margin:0];
  @apply tw:[padding:0.34rem_0.68rem];
  @apply tw:[border-radius:999px];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[background:rgba(255,_253,_241,_0.9)];
  @apply tw:[color:#4d6120];
}

.course-metrics-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.55rem];
}

.course-metric-card {
  @apply tw:grid;
  @apply tw:[gap:0.18rem];
  @apply tw:[padding:0.72rem_0.78rem];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[background:rgba(255,_253,_241,_0.88)];
}

.course-metric-card span {
  @apply tw:[color:#637227];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.course-metric-card strong {
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:0.96rem];
  @apply tw:[line-height:1.25];
}

.course-progress-block {
  @apply tw:[gap:0.38rem];
  @apply tw:[padding:0.78rem_0.82rem];
  @apply tw:[border-radius:16px];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[background:rgba(255,_253,_241,_0.9)];
  @apply tw:[color:#4d6120];
}

.course-progress-track {
  @apply tw:[height:9px];
  @apply tw:[background:rgba(214,_230,_167,_0.7)];
}

.course-progress-block .progress-fill {
  @apply tw:[background:linear-gradient(90deg,_#1e4307_0%,_#7ca51f_100%)];
}

.summary-grid,
.dashboard-grid,
.course-grid,
.mini-grid {
  @apply tw:grid;
  @apply tw:[gap:0.9rem];
}

.summary-grid {
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
}

.summary-grid .summary-card {
  @apply tw:[border-color:rgba(169,_213,_95,_0.52)];
  @apply tw:[background:#ffffff];
  @apply tw:[box-shadow:0_14px_28px_rgba(30,_67,_7,_0.06)];
}

.summary-card,
.panel,
.item-card,
.course-card,
.feed-item,
.simple-card,
.mini-card {
  @apply tw:[padding:0.95rem];
}

.icon-badge {
  @apply tw:[width:42px];
  @apply tw:[height:42px];
  @apply tw:[border-radius:15px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:shrink-0;
}

.summary-grid .icon-badge {
  @apply tw:[background:#eef4bf];
  @apply tw:[color:#4f6314];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(169,_213,_95,_0.45)];
}

.summary-label {
  @apply tw:[margin:0];
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:800];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
}

.summary-grid .summary-label {
  @apply tw:[color:#637227];
}

.summary-value {
  @apply tw:[font-size:1.9rem];
  @apply tw:[line-height:1];
  @apply tw:[letter-spacing:-0.04em];
}

.summary-grid .summary-value {
  @apply tw:[color:#31410f];
}

.summary-note {
  @apply tw:[margin:0];
  @apply tw:[color:var(--body)];
  @apply tw:[font-size:0.84rem];
}

.summary-grid .summary-note {
  @apply tw:[color:#556428];
}

.dashboard-grid {
  @apply tw:[grid-template-columns:minmax(0,_1.15fr)_minmax(320px,_0.85fr)];
}

.dashboard-grid.dashboard-grid-focused {
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:justify-items-center;
  @apply tw:[align-items:start];
}

.panel-focused {
  @apply tw:[width:min(100%,_3000px)];
  @apply tw:[align-self:start];
}

.panel-head-focus {
  @apply tw:items-start;
  @apply tw:justify-start;
}

.panel-head-focus .panel-heading {
  @apply tw:[width:min(100%,_860px)];
}

.grades-headline-row {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.55rem_0.75rem];
}

.grades-headline-row h3 {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
}

.grades-panel-focused {
  @apply tw:[gap:0.7rem];
  @apply tw:[align-content:start];
  @apply tw:[grid-auto-rows:max-content];
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#ffffff_100%)_padding-box,______linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box];
}

.grades-panel-focused .panel-subheader {
  @apply tw:[color:#4f6314];
}

.grades-panel-focused .panel-subtitle {
  @apply tw:[color:#4d6120];
}

.grades-focus-badge {
  @apply tw:shrink-0;
  @apply tw:[min-height:32px];
  @apply tw:[padding-inline:0.8rem];
}

.grades-focus-badge.warning {
  @apply tw:[background:#f4f7d8];
  @apply tw:[color:#4f6314];
}

.grades-focus-hero {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.5fr)_minmax(280px,_0.9fr)];
  @apply tw:[gap:0.9rem];
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[border-radius:22px];
  @apply tw:[border:1px_solid_rgba(191,_219,_254,_0.9)];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(37,_99,_235,_0.12),_transparent_36%),______linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)];
}

.grades-focus-copy,
.grades-focus-side,
.grades-focus-side-item {
  @apply tw:grid;
  @apply tw:[gap:0.45rem];
}

.grades-empty-hero,
.grades-empty-main,
.grades-empty-copy,
.grades-empty-guides,
.grades-empty-guide {
  @apply tw:grid;
}

.grades-empty-hero {
  @apply tw:[grid-template-columns:minmax(0,_1fr)];
  @apply tw:[gap:0.9rem];
  @apply tw:items-stretch;
  @apply tw:[padding:1rem_1.05rem];
  @apply tw:[border-radius:22px];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(255,_213,_66,_0.12),_transparent_38%),______linear-gradient(180deg,_#fffef8_0%,_#f9fce8_100%)];
}

.grades-empty-main {
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.9rem];
  @apply tw:[align-items:start];
}

.grades-empty-icon {
  @apply tw:[width:52px];
  @apply tw:[height:52px];
  @apply tw:[border-radius:18px];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[color:#4f6314];
  @apply tw:[background:rgba(244,_247,_216,_0.92)];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(169,_213,_95,_0.55)];
  @apply tw:[font-size:1.1rem];
}

.grades-empty-copy {
  @apply tw:[align-content:start];
  @apply tw:[gap:0.45rem];
}

.grades-empty-label {
  @apply tw:[color:#5f7418];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.grades-empty-copy h4 {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:clamp(1.2rem,_2vw,_1.65rem)];
  @apply tw:[line-height:1.15];
}

.grades-empty-copy p {
  @apply tw:[margin:0];
  @apply tw:[max-width:52ch];
  @apply tw:[color:#4d6120];
}

.grades-empty-guides {
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  @apply tw:[gap:0.7rem];
  @apply tw:content-stretch;
}

.grades-empty-guide {
  @apply tw:[align-content:start];
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:0.9rem_0.95rem];
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.42)];
  @apply tw:[background:rgba(255,_253,_241,_0.9)];
}

.grades-empty-guide span {
  @apply tw:[color:#637227];
  @apply tw:[font-size:0.73rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.grades-empty-guide p {
  @apply tw:[margin:0];
  @apply tw:[color:#1e4307];
  @apply tw:[font-size:0.92rem];
  @apply tw:[line-height:1.45];
}

.grades-focus-label {
  @apply tw:[margin:0];
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.grades-focus-score {
  @apply tw:[color:var(--ink)];
  @apply tw:[font-size:clamp(1.9rem,_4vw,_3rem)];
  @apply tw:[line-height:0.95];
  @apply tw:[letter-spacing:-0.05em];
}

.grades-focus-support {
  @apply tw:[color:#2563eb];
  @apply tw:[font-size:0.9rem];
  @apply tw:[font-weight:800];
}

.grades-focus-side {
  @apply tw:content-center;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.8rem];
}

.grades-focus-side-item {
  @apply tw:[padding:0.75rem_0.9rem];
  @apply tw:[border-radius:18px];
  @apply tw:[border:1px_solid_rgba(219,_234,_254,_0.95)];
  @apply tw:[background:rgba(255,_255,_255,_0.85)];
}

.grades-focus-side-item span {
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.05em];
  @apply tw:uppercase;
}

.grades-focus-side-item strong {
  @apply tw:[color:var(--ink)];
  @apply tw:[font-size:1.1rem];
  @apply tw:[line-height:1.25];
}

.recommendation-status-pill.ready {
  @apply tw:[background:#e8f4c7];
  @apply tw:[color:#1e4307];
}

.recommendation-status-pill.pending {
  @apply tw:[background:#f4f7d8];
  @apply tw:[color:#4f6314];
}

.grades-results-list {
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.8rem];
}

.grades-results-list .simple-card {
  @apply tw:[min-height:92px];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:[border-radius:20px];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)];
}

.grades-empty-state {
  @apply tw:[min-height:92px];
  @apply tw:[padding:0.9rem_1rem];
  @apply tw:items-center;
}

.panel-wide,
.panel-side,
.stack,
.feed {
  @apply tw:grid;
  @apply tw:[gap:0.75rem];
}

.panel-head,
.simple-card {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
}

.panel h3 {
  @apply tw:[font-size:1.1rem];
  @apply tw:[line-height:1.25];
}

.item-card.warning,
.item-card.urgent {
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#fffaf0_100%)];
}

.item-card.danger {
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#fff8f4_100%)];
}

.type.warning,
.type.urgent { @apply tw:[background:#fff7e7]; @apply tw:[color:#b45309]; }
.type.info { @apply tw:[background:#eaf1ff]; @apply tw:[color:#2563eb]; }
.type.teal { @apply tw:[background:#e8fffb]; @apply tw:[color:#0f766e]; }

.meta-row,
.teacher-copy {
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:700];
}

.progress-block {
  @apply tw:grid;
  @apply tw:[gap:0.4rem];
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:800];
}

.progress-track {
  @apply tw:w-full;
  @apply tw:[height:10px];
  @apply tw:[border-radius:999px];
  @apply tw:overflow-hidden;
  @apply tw:[background:rgba(226,_232,_240,_0.95)];
}

.progress-track.light {
  @apply tw:[background:rgba(255,_255,_255,_0.24)];
}

.progress-fill {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[background:linear-gradient(90deg,_#2563eb_0%,_#14b8a6_100%)];
}

.feed {
  @apply tw:[list-style:none];
  @apply tw:[margin:0];
  @apply tw:[padding:0];
}

.feed-item {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.75rem];
}

.feed-copy {
  @apply tw:[min-width:0];
  @apply tw:grid;
  @apply tw:[gap:0.35rem];
}

.feed-copy strong,
.simple-card strong,
.course-card h4,
.item-card h4 {
  @apply tw:[color:var(--ink)];
}

.feed-copy small,
.score-meta small {
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:700];
}

.mini-grid {
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
}

.recommendation-mini-grid {
  @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
}

.mini-card span {
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:uppercase;
  @apply tw:[letter-spacing:0.05em];
}

.mini-card strong {
  @apply tw:[color:var(--ink)];
  @apply tw:[font-size:1.1rem];
}

.mini-card.wide {
  @apply tw:[grid-column:1_/_-1];
}

.score-meta {
  @apply tw:[min-width:110px];
  @apply tw:grid;
  @apply tw:justify-items-end;
  @apply tw:[gap:0.15rem];
}

.score-value {
  @apply tw:[color:#2563eb];
  @apply tw:[font-weight:900];
}

.insight-hero {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.2fr)_minmax(220px,_0.8fr)];
  @apply tw:[gap:1rem];
  @apply tw:[padding:1rem];
  @apply tw:[border-radius:22px];
  @apply tw:[border:1px_solid_rgba(169,_213,_95,_0.32)];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.12)];
  @apply tw:[background:linear-gradient(135deg,_#1e4307_0%,_#5f7418_55%,_#95c331_100%)];
}

.insight-hero.pending {
  @apply tw:[border-color:rgba(169,_213,_95,_0.34)];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(255,_213,_66,_0.14),_transparent_30%),______linear-gradient(135deg,_#445711_0%,_#6b8c1b_55%,_#93bb33_100%)];
}

.insight-copy,
.insight-progress {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
}

.insight-copy {
  @apply tw:content-center;
}

.insight-kicker,
.insight-progress-label {
  @apply tw:[color:rgba(255,_255,_255,_0.78)];
  @apply tw:[font-size:0.74rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.06em];
  @apply tw:uppercase;
}

.insight-callout {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:w-fit;
  @apply tw:[min-height:36px];
  @apply tw:[padding:0.55rem_0.8rem];
  @apply tw:[border-radius:14px];
  @apply tw:[background:rgba(255,_255,_255,_0.12)];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.16)];
  @apply tw:[color:rgba(255,_255,_255,_0.92)];
  @apply tw:[font-size:0.82rem];
  @apply tw:[font-weight:700];
  @apply tw:[line-height:1.45];
}

.insight-callout i {
  @apply tw:[font-size:0.86rem];
}

.insight-progress {
  @apply tw:content-center;
  @apply tw:[padding:0.95rem_1rem];
  @apply tw:[border-radius:18px];
  @apply tw:[background:rgba(255,_255,_255,_0.12)];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.14)];
}

.insight-progress strong {
  @apply tw:[font-size:clamp(1.8rem,_4vw,_2.35rem)];
  @apply tw:[line-height:1];
  @apply tw:[letter-spacing:-0.04em];
}

.insight-progress small {
  @apply tw:[font-size:0.83rem];
  @apply tw:[font-weight:800];
}

.panel[data-dashboard-section="recommendations"] {
  @apply tw:[border:1px_solid_transparent];
  @apply tw:[background:linear-gradient(180deg,_#ffffff_0%,_#ffffff_100%)_padding-box,______linear-gradient(135deg,_#1e4307_0%,_#ffd542_42%,_#bbff59_100%)_border-box];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease];
}

.panel[data-dashboard-section="recommendations"]:hover {
  @apply tw:[transform:translateY(-2px)];
  @apply tw:[box-shadow:0_18px_34px_rgba(30,_67,_7,_0.12),_0_0_0_3px_rgba(124,_165,_31,_0.1)];
}

.panel[data-dashboard-section="recommendations"]:hover .insight-hero.pending {
  @apply tw:[border-color:rgba(187,_255,_89,_0.42)];
  @apply tw:[background:radial-gradient(circle_at_top_right,_rgba(255,_213,_66,_0.18),_transparent_30%),______linear-gradient(135deg,_#1e4307_0%,_#5f7418_55%,_#93bb33_100%)];
}

.panel[data-dashboard-section="recommendations"] > .panel-head .panel-subheader {
  @apply tw:[color:#4f6314];
}

.panel[data-dashboard-section="recommendations"] > .panel-head .panel-heading h3 {
  @apply tw:[color:#1e4307];
}

.panel[data-dashboard-section="recommendations"] > .panel-head .panel-subtitle {
  @apply tw:[color:#4d6120];
}

.panel[data-dashboard-section="recommendations"] .mini-card {
  @apply tw:[border-color:rgba(169,_213,_95,_0.42)];
  @apply tw:[background:rgb(255,_255,_255)];
  @apply tw:[transition:transform_0.2s_ease,_box-shadow_0.2s_ease,_border-color_0.2s_ease,_background_0.2s_ease];
}

.panel[data-dashboard-section="recommendations"] .mini-card:hover {
  @apply tw:[transform:translateY(-1px)];
  @apply tw:[border-color:#7ca51f];
  @apply tw:[background:linear-gradient(180deg,_#fbfde9_0%,_#f1f6cf_100%)];
  @apply tw:[box-shadow:0_10px_20px_rgba(30,_67,_7,_0.08)];
}

.panel[data-dashboard-section="recommendations"] .mini-card span {
  @apply tw:[color:#637227];
}

.panel[data-dashboard-section="recommendations"] .mini-card strong {
  @apply tw:[color:#1e4307];
}

.panel[data-dashboard-section="recommendations"] .progress-fill {
  @apply tw:[background:linear-gradient(90deg,_#1e4307_0%,_#7ca51f_100%)];
}

.panel.section-highlight {
  @apply tw:[border-color:rgba(37,_99,_235,_0.45)];
  @apply tw:[box-shadow:0_18px_38px_rgba(15,_23,_42,_0.08),_0_0_0_3px_rgba(37,_99,_235,_0.12)];
  @apply tw:[animation:section-highlight-pulse_1s_ease];
}

.insight-hero h4,
.insight-hero p,
.insight-hero strong,
.insight-hero small {
  @apply tw:[color:#ffffff];
}

@keyframes section-highlight-pulse {
  0% {
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08), 0 0 0 0 rgba(37, 99, 235, 0.16);
  }

  55% {
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08), 0 0 0 6px rgba(37, 99, 235, 0.08);
  }

  100% {
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08), 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
}

@media (max-width: 1180px) {
  .hero,
  .dashboard-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .summary-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .recommendation-mini-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }
}

@media (max-width: 860px) {
  .course-grid,
  .mini-grid,
  .insight-hero,
  .grades-focus-hero,
  .grades-focus-side,
  .grades-empty-hero,
  .grades-empty-main,
  .grades-empty-guides,
  .grades-results-list {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .course-directory-panel .course-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }
}

@media (max-width: 900px) {
  .classwork-list {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }
}

@media (max-width: 640px) {
  .summary-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .panel-head,
  .simple-card,
  .spread {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .panel-link {
    @apply tw:w-full;
  }

  .classwork-card-top {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .classwork-due-pill {
    @apply tw:[justify-self:start];
  }

  .course-card-top,
  .course-metrics-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .course-status-pill {
    @apply tw:[justify-self:start];
  }

  .score-meta {
    @apply tw:[min-width:0];
    @apply tw:justify-items-start;
  }
}

/* Premium Student Dashboard redesign — intentionally namespaced to this component. */
.premium-dashboard {
  --forest: #1e4307;
  --leaf: #4f7d3a;
  --sage: #6f9d58;
  --mint: #dcead3;
  --canvas: #f7fbf4;
  --ink: #18320d;
  --muted: #657361;
  --line: #dfe9d9;
  --white: #ffffff;
  --shadow-sm: 0 4px 16px rgba(30, 67, 7, 0.06);
  --shadow-md: 0 14px 36px rgba(30, 67, 7, 0.1);
  @apply tw:box-border;
  @apply tw:w-full;
  @apply tw:min-h-full;
  @apply tw:[padding:clamp(1rem,_2.2vw,_2rem)];
  @apply tw:[color:var(--ink)];
  @apply tw:[font-family:Inter,_"Segoe_UI",_system-ui,_-apple-system,_sans-serif];
}

.premium-dashboard *,
.premium-dashboard *::before,
.premium-dashboard *::after {
  @apply tw:box-border;
}

.premium-dashboard h1,
.premium-dashboard h2,
.premium-dashboard h3,
.premium-dashboard p {
  @apply tw:[margin:0];
}

.premium-dashboard a {
  @apply tw:[text-decoration:none];
}

.premium-hero {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.45fr)_minmax(16rem,_0.55fr)];
  @apply tw:items-center;
  @apply tw:[min-height:17rem];
  @apply tw:[padding:clamp(1.5rem,_4vw,_3rem)];
  @apply tw:overflow-hidden;
  @apply tw:[color:var(--white)];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.16)];
  @apply tw:[border-radius:20px];
  @apply tw:[background:radial-gradient(circle_at_78%_15%,_rgba(180,_216,_158,_0.23),_transparent_18rem),______linear-gradient(128deg,_#4f8a35_0%,_#245f00_52%,_#144300_100%)];
  @apply tw:[box-shadow:0_20px_48px_rgba(30,_67,_7,_0.2)];
  @apply tw:isolate;
}

.premium-hero::before,
.premium-hero::after {
  @apply tw:absolute;
  @apply tw:[z-index:-1];
  @apply tw:[border-radius:50%];
  @apply tw:[content:""];
}

.premium-hero::before {
  @apply tw:[right:-5rem];
  @apply tw:[bottom:-9rem];
  @apply tw:[width:25rem];
  @apply tw:[height:25rem];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.12)];
}

.premium-hero::after {
  @apply tw:[top:-8rem];
  @apply tw:[right:14rem];
  @apply tw:[width:17rem];
  @apply tw:[height:17rem];
  @apply tw:[background:rgba(255,_255,_255,_0.035)];
}

.premium-hero__content {
  @apply tw:relative;
  @apply tw:[z-index:2];
  @apply tw:[max-width:48rem];
  @apply tw:[color:#ffffff];
}

.premium-eyebrow {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[color:var(--leaf)];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.12em];
  @apply tw:[line-height:1.4];
  @apply tw:uppercase;
}

.premium-hero .premium-eyebrow {
  @apply tw:[color:#dcefd1];
}

.premium-dashboard .premium-hero h1 {
  @apply tw:[max-width:45rem];
  @apply tw:[margin-top:0.65rem];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:clamp(2rem,_4vw,_3.35rem)];
  @apply tw:[font-weight:760];
  @apply tw:[letter-spacing:-0.045em];
  @apply tw:[line-height:1.06];
}

.premium-dashboard .premium-hero__content > p:not(.premium-alert) {
  @apply tw:[max-width:42rem];
  @apply tw:[margin-top:0.85rem];
  @apply tw:[color:#e4efde];
  @apply tw:[font-size:clamp(0.95rem,_1.5vw,_1.08rem)];
  @apply tw:[line-height:1.65];
}

.premium-identity {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.6rem];
  @apply tw:[margin-top:1.35rem];
}

.premium-dashboard .premium-identity span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[min-height:2.25rem];
  @apply tw:[padding:0.48rem_0.8rem];
  @apply tw:[color:#ffffff];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.17)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.12)];
  @apply tw:[backdrop-filter:blur(8px)];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:650];
  @apply tw:[text-shadow:0_1px_2px_rgba(10,_35,_2,_0.25)];
}

.premium-dashboard .premium-identity i {
  @apply tw:[color:#d8edcb];
}

/* Keep hero copy readable despite the legacy student stylesheet's important text overrides. */
.premium-dashboard .premium-hero .premium-hero__content,
.premium-dashboard .premium-hero .premium-hero__content h1,
.premium-dashboard .premium-hero .premium-hero__content .premium-eyebrow,
.premium-dashboard .premium-hero .premium-hero__content .premium-identity span {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.premium-dashboard .premium-hero .premium-hero__content > p:not(.premium-alert) {
  @apply tw:[color:#e4efde]!;
  @apply tw:[-webkit-text-fill-color:#e4efde]!;
}

.premium-dashboard .premium-hero .premium-hero__content .premium-eyebrow i,
.premium-dashboard .premium-hero .premium-hero__content .premium-identity i {
  @apply tw:[color:#d8edcb]!;
  @apply tw:[-webkit-text-fill-color:#d8edcb]!;
}

.premium-alert {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:w-fit;
  @apply tw:[margin-top:1rem]!;
  @apply tw:[padding:0.65rem_0.8rem];
  @apply tw:[color:#fff4d2]!;
  @apply tw:[border:1px_solid_rgba(255,_235,_165,_0.24)];
  @apply tw:[border-radius:10px];
  @apply tw:[background:rgba(104,_66,_7,_0.28)];
  @apply tw:[font-size:0.78rem]!;
}

.premium-hero__visual {
  @apply tw:relative;
  @apply tw:[min-height:12rem];
}

.visual-book {
  @apply tw:absolute;
  @apply tw:[top:50%];
  @apply tw:[left:50%];
  @apply tw:grid;
  @apply tw:[width:7.5rem];
  @apply tw:[height:7.5rem];
  @apply tw:place-items-center;
  @apply tw:[color:var(--forest)];
  @apply tw:[border:8px_solid_rgba(255,_255,_255,_0.16)];
  @apply tw:[border-radius:28px];
  @apply tw:[background:linear-gradient(145deg,_#ffffff,_#dcead3)];
  @apply tw:[box-shadow:0_22px_42px_rgba(7,_28,_2,_0.3)];
  @apply tw:[font-size:2.8rem];
  @apply tw:[transform:translate(-50%,_-50%)_rotate(-4deg)];
  @apply tw:[animation:premium-float_4.8s_ease-in-out_infinite];
}

.visual-chip {
  @apply tw:absolute;
  @apply tw:[z-index:2];
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.42rem];
  @apply tw:[padding:0.55rem_0.75rem];
  @apply tw:[color:var(--forest)];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.65)];
  @apply tw:[border-radius:12px];
  @apply tw:[background:rgba(255,_255,_255,_0.9)];
  @apply tw:[box-shadow:var(--shadow-md)];
  @apply tw:[font-size:0.72rem];
  @apply tw:[font-weight:800];
  @apply tw:[backdrop-filter:blur(8px)];
}

.visual-chip i {
  @apply tw:[color:var(--leaf)];
}

.visual-chip--top {
  @apply tw:[top:0.25rem];
  @apply tw:[right:0];
}

.visual-chip--bottom {
  @apply tw:[right:1.5rem];
  @apply tw:[bottom:0];
}

.visual-orbit {
  @apply tw:absolute;
  @apply tw:[inset:50%_auto_auto_50%];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.16)];
  @apply tw:[border-radius:50%];
  @apply tw:[transform:translate(-50%,_-50%)];
}

.visual-orbit--one {
  @apply tw:[width:12rem];
  @apply tw:[height:12rem];
}

.visual-orbit--two {
  @apply tw:[width:16rem];
  @apply tw:[height:16rem];
}

.premium-dashboard a:focus-visible {
  @apply tw:[outline:3px_solid_rgba(111,_157,_88,_0.42)];
  @apply tw:[outline-offset:3px];
}

.premium-overview {
  @apply tw:[margin:1.5rem_0];
}

.premium-section-heading {
  @apply tw:flex;
  @apply tw:items-end;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1rem];
}

.premium-section-heading h2,
.premium-panel__header h2,
.premium-focus-card h2 {
  @apply tw:[margin-top:0.3rem];
  @apply tw:[color:var(--ink)];
  @apply tw:[font-size:clamp(1.25rem,_2vw,_1.62rem)];
  @apply tw:[font-weight:760];
  @apply tw:[letter-spacing:-0.025em];
}

.premium-section-heading > p,
.premium-panel__header p {
  @apply tw:[max-width:37rem];
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.84rem];
  @apply tw:[line-height:1.55];
}

.premium-summary-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.premium-summary-card {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.9rem];
  @apply tw:[min-height:9.5rem];
  @apply tw:[padding:1.15rem];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_var(--line)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:var(--white)];
  @apply tw:[box-shadow:var(--shadow-sm)];
  @apply tw:[transition:border-color_200ms_ease,_box-shadow_200ms_ease,_transform_200ms_ease];
}

.premium-summary-card::after {
  @apply tw:absolute;
  @apply tw:[right:-2rem];
  @apply tw:[bottom:-3rem];
  @apply tw:[width:7rem];
  @apply tw:[height:7rem];
  @apply tw:[border-radius:50%];
  @apply tw:[background:var(--card-wash,_rgba(220,_234,_211,_0.45))];
  @apply tw:[content:""];
}

.premium-summary-card:hover {
  @apply tw:[border-color:#c9ddbd];
  @apply tw:[box-shadow:var(--shadow-md)];
  @apply tw:[transform:translateY(-4px)];
}

.premium-summary-card--warning { --card-accent: #9a6810; --card-wash: rgba(248, 224, 172, 0.35); }
.premium-summary-card--info { --card-accent: #32677f; --card-wash: rgba(191, 224, 233, 0.35); }
.premium-summary-card--teal { --card-accent: #397467; --card-wash: rgba(190, 226, 214, 0.38); }
.premium-summary-card--success { --card-accent: var(--leaf); --card-wash: rgba(220, 234, 211, 0.55); }

.premium-summary-card__icon {
  @apply tw:grid;
  @apply tw:[width:3.15rem];
  @apply tw:[height:3.15rem];
  @apply tw:place-items-center;
  @apply tw:[color:var(--card-accent,_var(--leaf))];
  @apply tw:[border-radius:14px];
  @apply tw:[background:color-mix(in_srgb,_var(--card-accent,_var(--leaf))_11%,_white)];
  @apply tw:[font-size:1.22rem];
}

.premium-summary-card__copy {
  @apply tw:[min-width:0];
}

.premium-summary-card__copy > span {
  @apply tw:block;
  @apply tw:overflow-hidden;
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:720];
  @apply tw:text-ellipsis;
  @apply tw:whitespace-nowrap;
}

.premium-summary-card__copy strong {
  @apply tw:block;
  @apply tw:[margin-top:0.25rem];
  @apply tw:[color:var(--ink)];
  @apply tw:[font-size:clamp(1.65rem,_2.8vw,_2.15rem)];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:-0.04em];
  @apply tw:[line-height:1.1];
  @apply tw:[animation:premium-count-in_500ms_cubic-bezier(0.2,_0.8,_0.2,_1)_both];
}

.premium-summary-card__copy p {
  @apply tw:[margin-top:0.55rem];
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.73rem];
  @apply tw:[line-height:1.45];
}

.premium-summary-card__arrow {
  @apply tw:absolute;
  @apply tw:[right:0.9rem];
  @apply tw:[bottom:0.75rem];
  @apply tw:[z-index:1];
  @apply tw:[color:var(--card-accent,_var(--leaf))];
  @apply tw:[opacity:0.65];
  @apply tw:[font-size:0.8rem];
}

.premium-content-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.65fr)_minmax(16.5rem,_0.55fr)];
  @apply tw:[gap:1.25rem];
  @apply tw:[margin-bottom:1.5rem];
}

.premium-panel {
  @apply tw:[min-width:0];
  @apply tw:[padding:clamp(1.1rem,_2vw,_1.5rem)];
  @apply tw:[border:1px_solid_var(--line)];
  @apply tw:[border-radius:20px];
  @apply tw:[background:var(--white)];
  @apply tw:[box-shadow:var(--shadow-sm)];
}

.premium-panel__header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1.25rem];
}

.premium-panel__header h1,
.premium-panel__header h2 {
  @apply tw:[margin:0.28rem_0_0.3rem];
  @apply tw:[color:var(--ink)];
  @apply tw:[font-size:clamp(1.3rem,_2vw,_1.7rem)];
  @apply tw:[font-weight:780];
  @apply tw:[letter-spacing:-0.03em];
}

.premium-text-link {
  @apply tw:inline-flex;
  @apply tw:flex-none;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:0.65rem_0.8rem];
  @apply tw:[color:var(--leaf)];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#f3f8ef];
  @apply tw:[font-size:0.76rem];
  @apply tw:[font-weight:780];
  @apply tw:[transition:gap_180ms_ease,_color_180ms_ease,_background_180ms_ease];
}

.premium-text-link:hover {
  @apply tw:[gap:0.7rem];
  @apply tw:[color:var(--forest)];
  @apply tw:[background:var(--mint)];
}

.premium-timeline {
  @apply tw:relative;
  @apply tw:grid;
}

.premium-task {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[grid-template-columns:2.75rem_minmax(0,_1fr)];
  @apply tw:[gap:0.85rem];
  @apply tw:[padding:0.9rem_0];
}

.premium-task:not(:last-child) {
  @apply tw:[border-bottom:1px_solid_#edf2e9];
}

.premium-task__rail {
  @apply tw:relative;
  @apply tw:flex;
  @apply tw:justify-center;
}

.premium-task__rail::after {
  @apply tw:absolute;
  @apply tw:[top:2.75rem];
  @apply tw:[bottom:-1rem];
  @apply tw:[width:2px];
  @apply tw:[background:#e4edde];
  @apply tw:[content:""];
}

.premium-task:last-child .premium-task__rail::after {
  @apply tw:hidden;
}

.premium-task__rail > span {
  @apply tw:[z-index:1];
  @apply tw:grid;
  @apply tw:[width:2.6rem];
  @apply tw:[height:2.6rem];
  @apply tw:place-items-center;
  @apply tw:[color:var(--task-accent,_var(--leaf))];
  @apply tw:[border:4px_solid_var(--white)];
  @apply tw:[border-radius:12px];
  @apply tw:[background:var(--task-bg,_#eaf3e5)];
  @apply tw:[box-shadow:0_0_0_1px_#dbe7d4];
}

.premium-task--danger { --task-accent: #a73d3d; --task-bg: #fce9e8; }
.premium-task--urgent { --task-accent: #bb581e; --task-bg: #fff0e5; }
.premium-task--warning { --task-accent: #93630b; --task-bg: #fff6dc; }
.premium-task--info { --task-accent: #38708b; --task-bg: #e7f2f7; }
.premium-task--success { --task-accent: var(--leaf); --task-bg: #eaf3e5; }

.premium-task__body {
  @apply tw:[min-width:0];
}

.premium-task__topline {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:0.8rem];
}

.premium-subject-label {
  @apply tw:block;
  @apply tw:max-w-full;
  @apply tw:overflow-hidden;
  @apply tw:[color:var(--leaf)];
  @apply tw:[font-size:0.67rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.09em];
  @apply tw:text-ellipsis;
  @apply tw:uppercase;
  @apply tw:whitespace-nowrap;
}

.premium-task h3 {
  @apply tw:[margin-top:0.25rem];
  @apply tw:[color:#203a16];
  @apply tw:[font-size:0.93rem];
  @apply tw:[font-weight:760];
  @apply tw:[line-height:1.35];
}

.premium-due-badge {
  @apply tw:flex-none;
  @apply tw:[padding:0.36rem_0.56rem];
  @apply tw:[color:#366028];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#eaf3e5];
  @apply tw:[font-size:0.64rem];
  @apply tw:[font-weight:800];
  @apply tw:whitespace-nowrap;
}

.premium-due-badge--danger { @apply tw:[color:#993636]; @apply tw:[background:#fce8e7]; }
.premium-due-badge--urgent { @apply tw:[color:#a94a14]; @apply tw:[background:#fff0e4]; }
.premium-due-badge--warning { @apply tw:[color:#845809]; @apply tw:[background:#fff5d8]; }
.premium-due-badge--info { @apply tw:[color:#32677f]; @apply tw:[background:#e5f1f5]; }

.premium-task__chips {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.42rem];
  @apply tw:[margin-top:0.65rem];
}

.premium-task__chips span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.35rem];
  @apply tw:[color:#6c7868];
  @apply tw:[font-size:0.65rem];
  @apply tw:[font-weight:650];
}

.premium-task__chips span:not(:last-child)::after {
  @apply tw:[margin-left:0.15rem];
  @apply tw:[color:#c1cbbd];
  @apply tw:[content:"•"];
}

.premium-task__chips i {
  @apply tw:[color:#8aa07f];
  @apply tw:[font-size:0.55rem];
}

.premium-status--success { @apply tw:[color:var(--leaf)]!; }
.premium-status--danger { @apply tw:[color:#a33c3c]!; }
.premium-status--warning { @apply tw:[color:#8d620e]!; }
.premium-status--violet { @apply tw:[color:#7252a3]!; }
.premium-status--info { @apply tw:[color:#33718d]!; }

.premium-task__progress {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(4rem,_10rem)_auto];
  @apply tw:[gap:0.55rem];
  @apply tw:items-center;
  @apply tw:[margin-top:0.65rem];
}

.premium-task__progress > span {
  @apply tw:[height:0.3rem];
  @apply tw:overflow-hidden;
  @apply tw:[border-radius:999px];
  @apply tw:[background:#edf2ea];
}

.premium-task__progress > span > span {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:var(--task-accent,_var(--leaf))];
  @apply tw:[transition:width_500ms_ease];
}

.premium-task__progress small {
  @apply tw:[color:#879182];
  @apply tw:[font-size:0.61rem];
  @apply tw:[font-weight:650];
}

.premium-focus-card {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:items-center;
  @apply tw:text-center;
  @apply tw:[background:radial-gradient(circle_at_50%_26%,_rgba(220,_234,_211,_0.56),_transparent_11rem),______var(--white)];
}

.premium-focus-ring {
  @apply tw:grid;
  @apply tw:[width:9.5rem];
  @apply tw:[height:9.5rem];
  @apply tw:[margin:1.35rem_auto_1rem];
  @apply tw:place-items-center;
  @apply tw:[border-radius:50%];
  @apply tw:[background:conic-gradient(var(--leaf)_var(--focus-progress),_#e5eee0_0deg)];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(30,_67,_7,_0.04)];
}

.premium-focus-ring::before {
  @apply tw:[grid-area:1_/_1];
  @apply tw:[width:7.4rem];
  @apply tw:[height:7.4rem];
  @apply tw:[border-radius:50%];
  @apply tw:[background:var(--white)];
  @apply tw:[box-shadow:0_6px_18px_rgba(30,_67,_7,_0.08)];
  @apply tw:[content:""];
}

.premium-focus-ring > div {
  @apply tw:[z-index:1];
  @apply tw:grid;
  @apply tw:[grid-area:1_/_1];
  @apply tw:[gap:0.1rem];
}

.premium-focus-ring strong {
  @apply tw:[color:var(--forest)];
  @apply tw:[font-size:1.9rem];
  @apply tw:[letter-spacing:-0.05em];
}

.premium-focus-ring span {
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.66rem];
  @apply tw:[font-weight:700];
}

.premium-focus-card > p {
  @apply tw:[max-width:18rem];
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.55];
}

.premium-focus-stats {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_1fr)];
  @apply tw:[gap:0.6rem];
  @apply tw:w-full;
  @apply tw:[margin:1rem_0];
}

.premium-focus-stats div {
  @apply tw:grid;
  @apply tw:[gap:0.25rem];
  @apply tw:[padding:0.75rem_0.5rem];
  @apply tw:[border:1px_solid_#e3ebde];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#f8fbf6];
}

.premium-focus-stats span {
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.63rem];
}

.premium-focus-stats strong {
  @apply tw:[color:var(--forest)];
  @apply tw:[font-size:1rem];
}

.premium-button {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.5rem];
  @apply tw:[min-height:2.7rem];
  @apply tw:[padding:0.65rem_0.95rem];
  @apply tw:[color:var(--white)];
  @apply tw:[border-radius:11px];
  @apply tw:[background:var(--forest)];
  @apply tw:[box-shadow:0_8px_18px_rgba(30,_67,_7,_0.14)];
  @apply tw:[font-size:0.75rem];
  @apply tw:[font-weight:780];
  @apply tw:[transition:gap_180ms_ease,_background_180ms_ease,_transform_180ms_ease];
}

.premium-button:not(.premium-button--soft),
.premium-button:not(.premium-button--soft) i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.premium-button:hover {
  @apply tw:[gap:0.7rem];
  @apply tw:[background:#2b5c10];
  @apply tw:[transform:translateY(-2px)];
}

.premium-button--soft {
  @apply tw:w-full;
  @apply tw:mt-auto;
  @apply tw:[color:var(--forest)];
  @apply tw:[background:var(--mint)];
  @apply tw:[box-shadow:none];
}

.premium-button--soft:hover {
  @apply tw:[color:var(--white)];
}

.premium-classes {
  @apply tw:[margin-bottom:1rem];
}

.premium-course-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.premium-course-card {
  @apply tw:[min-width:0];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_#dde8d7];
  @apply tw:[border-radius:18px];
  @apply tw:[background:var(--white)];
  @apply tw:[box-shadow:0_4px_12px_rgba(30,_67,_7,_0.045)];
  @apply tw:[transition:border-color_200ms_ease,_box-shadow_200ms_ease,_transform_200ms_ease];
}

.premium-course-card:hover {
  @apply tw:[border-color:#bed3b3];
  @apply tw:[box-shadow:var(--shadow-md)];
  @apply tw:[transform:translateY(-5px)];
}

.premium-course-card__banner {
  --course-accent: #4f7d3a;
  --course-light: #e2eedb;
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[min-height:5rem];
  @apply tw:[padding:0.9rem];
  @apply tw:[background:radial-gradient(circle_at_92%_10%,_rgba(255,_255,_255,_0.4),_transparent_3.5rem),______linear-gradient(135deg,_var(--course-accent),_color-mix(in_srgb,_var(--course-accent)_70%,_#1e4307))];
}

.premium-course-card--2 .premium-course-card__banner { --course-accent: #5e866c; }
.premium-course-card--3 .premium-course-card__banner { --course-accent: #607f9c; }
.premium-course-card--4 .premium-course-card__banner { --course-accent: #8d7444; }

.premium-course-card__icon {
  @apply tw:grid;
  @apply tw:[width:2.8rem];
  @apply tw:[height:2.8rem];
  @apply tw:place-items-center;
  @apply tw:[color:var(--course-accent)];
  @apply tw:[border-radius:12px];
  @apply tw:[background:rgba(255,_255,_255,_0.9)];
  @apply tw:[box-shadow:0_6px_16px_rgba(17,_42,_8,_0.17)];
}

.premium-course-card__status {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.3rem];
  @apply tw:[padding:0.33rem_0.5rem];
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.28)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(16,_43,_7,_0.2)];
  @apply tw:[font-size:0.6rem];
  @apply tw:[font-weight:750];
}

.premium-course-card__status i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
  @apply tw:[font-size:0.35rem];
}

.premium-course-card__status i::before {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.premium-course-card__body {
  @apply tw:[padding:1rem];
}

.premium-course-card h3 {
  @apply tw:[min-height:2.5rem];
  @apply tw:[margin-top:0.28rem];
  @apply tw:[color:var(--ink)];
  @apply tw:[font-size:0.98rem];
  @apply tw:[line-height:1.3];
}

.premium-course-card__teacher,
.premium-course-card__schedule {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:[gap:0.4rem];
  @apply tw:[margin-top:0.55rem]!;
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.68rem];
  @apply tw:[line-height:1.35];
}

.premium-course-card__teacher i,
.premium-course-card__schedule i {
  @apply tw:[width:0.8rem];
  @apply tw:[margin-top:0.1rem];
  @apply tw:[color:var(--sage)];
}

.premium-course-card__metrics {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.45rem];
  @apply tw:[margin-top:0.8rem];
}

.premium-course-card__metrics span {
  @apply tw:grid;
  @apply tw:[gap:0.15rem];
  @apply tw:[padding:0.55rem];
  @apply tw:[color:var(--muted)];
  @apply tw:[border-radius:9px];
  @apply tw:[background:#f7faf5];
  @apply tw:[font-size:0.6rem];
}

.premium-course-card__metrics strong {
  @apply tw:[color:var(--forest)];
  @apply tw:[font-size:0.88rem];
}

.premium-course-card__progress {
  @apply tw:[margin-top:0.8rem];
}

.premium-course-card__progress > div {
  @apply tw:flex;
  @apply tw:justify-between;
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.64rem];
}

.premium-course-card__progress strong {
  @apply tw:[color:var(--forest)];
}

.premium-progress-track {
  @apply tw:block;
  @apply tw:[height:0.4rem];
  @apply tw:[margin-top:0.42rem];
  @apply tw:overflow-hidden;
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e7eee3];
}

.premium-progress-track > span {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:linear-gradient(90deg,_var(--leaf),_var(--sage))];
  @apply tw:[transition:width_600ms_ease];
}

.premium-course-card__actions {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:0.45rem];
  @apply tw:[margin-top:0.9rem];
  @apply tw:[padding-top:0.8rem];
  @apply tw:[border-top:1px_solid_#edf2ea];
}

.premium-course-card__actions a {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.35rem];
  @apply tw:[padding:0.52rem];
  @apply tw:[color:var(--leaf)];
  @apply tw:[border:1px_solid_#dce8d6];
  @apply tw:[border-radius:9px];
  @apply tw:[font-size:0.64rem];
  @apply tw:[font-weight:760];
  @apply tw:[transition:color_180ms_ease,_background_180ms_ease];
}

.premium-course-card__actions a:hover,
.premium-course-card__actions a:focus-visible {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
  @apply tw:[background:var(--forest)];
}

.premium-course-card__actions a:hover i,
.premium-course-card__actions a:hover i::before,
.premium-course-card__actions a:focus-visible i,
.premium-course-card__actions a:focus-visible i::before {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.premium-empty-state {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:1.25rem];
  @apply tw:items-center;
  @apply tw:[min-height:14rem];
  @apply tw:[padding:clamp(1.25rem,_3vw,_2rem)];
  @apply tw:[border:1px_dashed_#c7dabc];
  @apply tw:[border-radius:16px];
  @apply tw:[background:radial-gradient(circle_at_10%_50%,_rgba(220,_234,_211,_0.6),_transparent_12rem),______#f9fcf7];
}

.premium-empty-state__art {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[width:7rem];
  @apply tw:[height:7rem];
  @apply tw:place-items-center;
  @apply tw:[color:var(--leaf)];
  @apply tw:[border-radius:28px_28px_28px_8px];
  @apply tw:[background:linear-gradient(145deg,_#e8f2e2,_#d3e5c8)];
  @apply tw:[box-shadow:0_12px_26px_rgba(30,_67,_7,_0.1)];
  @apply tw:[font-size:2.4rem];
}

.empty-check {
  @apply tw:absolute;
  @apply tw:[top:-0.45rem];
  @apply tw:[right:-0.45rem];
  @apply tw:grid;
  @apply tw:[width:2.1rem];
  @apply tw:[height:2.1rem];
  @apply tw:place-items-center;
  @apply tw:[color:var(--white)];
  @apply tw:[border:4px_solid_#f9fcf7];
  @apply tw:[border-radius:50%];
  @apply tw:[background:var(--forest)];
  @apply tw:[font-size:0.65rem];
}

.empty-check i,
.empty-check i::before {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.premium-empty-state h3 {
  @apply tw:[margin:0.35rem_0_0.45rem];
  @apply tw:[color:var(--ink)];
  @apply tw:[font-size:1.18rem];
}

.premium-empty-state p {
  @apply tw:[max-width:38rem];
  @apply tw:[margin-bottom:0.9rem];
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.78rem];
  @apply tw:[line-height:1.6];
}

.premium-empty-state--classes {
  @apply tw:[min-height:12rem];
}

.premium-pending-note {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.55rem];
  @apply tw:[margin-top:1rem];
  @apply tw:[padding:0.75rem_0.9rem];
  @apply tw:[color:#795a15];
  @apply tw:[border:1px_solid_#f1dfae];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#fff9e8];
  @apply tw:[font-size:0.73rem];
  @apply tw:[font-weight:680];
}

.premium-focus-panel {
  @apply tw:[min-height:calc(100vh_-_9rem)];
  @apply tw:[animation:premium-rise_350ms_ease_both];
}

.premium-grades-layout {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(14rem,_0.65fr)_minmax(0,_1fr)];
  @apply tw:[gap:1rem];
}

.premium-grade-hero {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:justify-center;
  @apply tw:[min-height:15rem];
  @apply tw:[padding:1.75rem];
  @apply tw:[color:var(--white)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:radial-gradient(circle_at_90%_10%,_rgba(255,_255,_255,_0.2),_transparent_10rem),______linear-gradient(145deg,_var(--forest),_var(--leaf))];
}

.premium-grade-hero > span {
  @apply tw:[color:#dcefd1];
  @apply tw:[font-size:0.73rem];
  @apply tw:[font-weight:750];
  @apply tw:uppercase;
}

.premium-grade-hero > strong {
  @apply tw:[margin-top:0.3rem];
  @apply tw:[font-size:clamp(2.5rem,_5vw,_4rem)];
  @apply tw:[letter-spacing:-0.06em];
}

.premium-grade-hero p {
  @apply tw:flex;
  @apply tw:[gap:0.4rem];
  @apply tw:items-center;
  @apply tw:[margin-top:0.6rem];
  @apply tw:[color:rgba(255,_255,_255,_0.78)];
  @apply tw:[font-size:0.78rem];
}

.premium-grade-stats {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
}

.premium-grade-stats article,
.premium-recommendation-grid article {
  @apply tw:grid;
  @apply tw:[gap:0.4rem];
  @apply tw:[padding:1.15rem];
  @apply tw:[border:1px_solid_#e1eadc];
  @apply tw:[border-radius:15px];
  @apply tw:[background:#f9fcf7];
}

.premium-grade-stats span,
.premium-recommendation-grid span {
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:680];
}

.premium-grade-stats strong,
.premium-recommendation-grid strong {
  @apply tw:[color:var(--forest)];
  @apply tw:[font-size:1.35rem];
}

.premium-results-list {
  @apply tw:grid;
  @apply tw:[grid-column:1_/_-1];
  @apply tw:[gap:0.65rem];
}

.premium-results-list article {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)_auto];
  @apply tw:[gap:0.75rem];
  @apply tw:items-center;
  @apply tw:[padding:0.85rem];
  @apply tw:[border:1px_solid_#e4ece0];
  @apply tw:[border-radius:13px];
  @apply tw:[transition:background_180ms_ease,_transform_180ms_ease];
}

.premium-results-list article:hover {
  @apply tw:[background:#f8fbf6];
  @apply tw:[transform:translateX(3px)];
}

.premium-results-list__icon {
  @apply tw:grid;
  @apply tw:[width:2.65rem];
  @apply tw:[height:2.65rem];
  @apply tw:place-items-center;
  @apply tw:[color:var(--leaf)];
  @apply tw:[border-radius:10px];
  @apply tw:[background:#e8f2e2];
}

.premium-results-list h3 {
  @apply tw:[color:var(--ink)];
  @apply tw:[font-size:0.85rem];
}

.premium-results-list p {
  @apply tw:[margin-top:0.2rem];
  @apply tw:[color:var(--muted)];
  @apply tw:[font-size:0.67rem];
}

.premium-results-list article > strong {
  @apply tw:[color:var(--forest)];
  @apply tw:[font-size:0.88rem];
}

.premium-empty-state--large {
  @apply tw:[min-height:24rem];
}

.premium-recommendation-hero {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.5fr)_minmax(14rem,_0.5fr)];
  @apply tw:[gap:1.5rem];
  @apply tw:items-center;
  @apply tw:[padding:clamp(1.5rem,_3vw,_2.5rem)];
  @apply tw:[color:var(--white)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:radial-gradient(circle_at_90%_10%,_rgba(220,_234,_211,_0.28),_transparent_17rem),______linear-gradient(135deg,_#173806,_var(--leaf))];
}

.premium-recommendation-status {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[padding:0.42rem_0.58rem];
  @apply tw:[color:#dff1d5];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.18)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.1)];
  @apply tw:[font-size:0.67rem];
  @apply tw:[font-weight:800];
}

.premium-recommendation-hero h2 {
  @apply tw:[margin-top:0.8rem];
  @apply tw:[color:var(--white)];
  @apply tw:[font-size:clamp(1.5rem,_3vw,_2.25rem)];
  @apply tw:[letter-spacing:-0.04em];
}

.premium-recommendation-hero p {
  @apply tw:[margin-top:0.55rem];
  @apply tw:[color:rgba(255,_255,_255,_0.74)];
  @apply tw:[font-size:0.86rem];
  @apply tw:[line-height:1.55];
}

.premium-recommendation-tip {
  @apply tw:flex;
  @apply tw:[gap:0.5rem];
  @apply tw:[margin-top:1rem];
  @apply tw:[padding:0.7rem];
  @apply tw:[color:#e8f4e1];
  @apply tw:[border-left:3px_solid_#a5cd8e];
  @apply tw:[background:rgba(255,_255,_255,_0.08)];
  @apply tw:[font-size:0.72rem];
}

.premium-dashboard .premium-recommendation-hero .premium-recommendation-status,
.premium-dashboard .premium-recommendation-hero h2,
.premium-dashboard .premium-recommendation-hero p,
.premium-dashboard .premium-recommendation-hero .premium-recommendation-tip,
.premium-dashboard .premium-recommendation-hero .premium-recommendation-status i,
.premium-dashboard .premium-recommendation-hero .premium-recommendation-tip i {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.premium-recommendation-progress {
  @apply tw:grid;
  @apply tw:[gap:0.4rem];
  @apply tw:[padding:1.2rem];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.18)];
  @apply tw:[border-radius:16px];
  @apply tw:[background:rgba(255,_255,_255,_0.1)];
  @apply tw:[backdrop-filter:blur(8px)];
}

.premium-recommendation-progress strong {
  @apply tw:[font-size:2.3rem];
}

.premium-recommendation-progress > span {
  @apply tw:[color:rgba(255,_255,_255,_0.75)];
  @apply tw:[font-size:0.72rem];
}

.premium-dashboard .premium-recommendation-progress > strong,
.premium-dashboard .premium-recommendation-progress > span {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.premium-recommendation-progress .premium-progress-track {
  @apply tw:[background:rgba(255,_255,_255,_0.15)];
}

.premium-recommendation-progress .premium-progress-track span {
  @apply tw:[background:#dcead3];
}

.premium-recommendation-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(6,_minmax(0,_1fr))];
  @apply tw:[gap:0.75rem];
  @apply tw:[margin-top:1rem];
}

.premium-recommendation-grid article:last-child {
  @apply tw:[grid-column:span_1];
}

.premium-recommendation-grid strong {
  @apply tw:[overflow-wrap:anywhere];
  @apply tw:[font-size:1.05rem];
}

.premium-skeleton-card,
.premium-skeleton-panel {
  @apply tw:pointer-events-none;
}

.skeleton {
  @apply tw:block;
  @apply tw:overflow-hidden;
  @apply tw:[border-radius:8px];
  @apply tw:[background:#e8eee5];
}

.skeleton::after {
  @apply tw:block;
  @apply tw:w-full;
  @apply tw:h-full;
  @apply tw:[background:linear-gradient(90deg,_transparent,_rgba(255,_255,_255,_0.75),_transparent)];
  @apply tw:[content:""];
  @apply tw:[transform:translateX(-100%)];
  @apply tw:[animation:premium-shimmer_1.35s_infinite];
}

.skeleton--icon { @apply tw:[width:3rem]; @apply tw:[height:3rem]; }
.skeleton--short { @apply tw:[width:65%]; @apply tw:[height:0.7rem]; }
.skeleton--value { @apply tw:[width:45%]; @apply tw:[height:1.8rem]; }
.skeleton--line { @apply tw:[grid-column:1_/_-1]; @apply tw:[width:80%]; @apply tw:[height:0.6rem]; }
.skeleton--heading { @apply tw:[width:10rem]; @apply tw:[height:1.6rem]; @apply tw:[margin-bottom:1.1rem]; }
.skeleton--task { @apply tw:w-full; @apply tw:[height:5.6rem]; @apply tw:[margin-top:0.65rem]; }
.skeleton--illustration { @apply tw:w-full; @apply tw:[height:16rem]; @apply tw:[margin-top:1rem]; }

.section-highlight {
  @apply tw:[animation:premium-highlight_1.8s_ease_both];
}

@keyframes premium-float {
  0%, 100% { transform: translate(-50%, -50%) rotate(-4deg); }
  50% { transform: translate(-50%, calc(-50% - 8px)) rotate(2deg); }
}

@keyframes premium-count-in {
  from { opacity: 0; transform: translateY(9px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes premium-rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes premium-shimmer {
  to { transform: translateX(100%); }
}

@keyframes premium-highlight {
  0%, 100% { box-shadow: var(--shadow-sm); }
  25%, 70% { box-shadow: 0 0 0 4px rgba(111, 157, 88, 0.24), 0 18px 42px rgba(30, 67, 7, 0.14); }
}

@media (max-width: 1180px) {
  .premium-summary-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .premium-course-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .premium-recommendation-grid {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }
}

@media (max-width: 900px) {
  .premium-hero {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .premium-hero__visual {
    @apply tw:hidden;
  }

  .premium-content-grid,
  .premium-grades-layout,
  .premium-recommendation-hero {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .premium-focus-card {
    @apply tw:items-stretch;
  }

  .premium-focus-card .premium-eyebrow,
  .premium-focus-card h2,
  .premium-focus-card > p {
    @apply tw:self-center;
  }

  .premium-recommendation-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }
}

@media (max-width: 640px) {
  .premium-dashboard {
    @apply tw:[padding:0.75rem];
  }

  .premium-hero {
    @apply tw:[min-height:15rem];
    @apply tw:[padding:1.25rem];
    @apply tw:[border-radius:18px];
  }

  .premium-hero h1 {
    @apply tw:[font-size:2rem];
  }

  .premium-identity {
    @apply tw:grid;
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .premium-identity span {
    @apply tw:w-fit;
  }

  .premium-section-heading,
  .premium-panel__header,
  .premium-task__topline {
    @apply tw:flex-col;
    @apply tw:items-start;
  }

  .premium-section-heading > p {
    @apply tw:hidden;
  }

  .premium-summary-grid,
  .premium-course-grid,
  .premium-grade-stats,
  .premium-recommendation-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .premium-summary-card {
    @apply tw:[min-height:8.2rem];
  }

  .premium-panel {
    @apply tw:[padding:1rem];
    @apply tw:[border-radius:17px];
  }

  .premium-text-link {
    @apply tw:w-full;
    @apply tw:justify-center;
  }

  .premium-task {
    @apply tw:[grid-template-columns:2.45rem_minmax(0,_1fr)];
    @apply tw:[gap:0.65rem];
  }

  .premium-task__rail > span {
    @apply tw:[width:2.25rem];
    @apply tw:[height:2.25rem];
    @apply tw:[border-radius:10px];
  }

  .premium-task__chips span:not(:last-child)::after {
    @apply tw:hidden;
  }

  .premium-task__progress {
    @apply tw:[grid-template-columns:minmax(4rem,_1fr)_auto];
  }

  .premium-empty-state {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
    @apply tw:text-center;
  }

  .premium-empty-state__art {
    @apply tw:[width:5.5rem];
    @apply tw:[height:5.5rem];
    @apply tw:[margin:0_auto];
    @apply tw:[font-size:1.9rem];
  }

  .premium-empty-state .premium-eyebrow {
    @apply tw:justify-center;
  }

  .premium-results-list article {
    @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  }

  .premium-results-list article > strong {
    @apply tw:[grid-column:2];
  }
}

/* Focused Recent Results — isolated from the recommendation view. */
.premium-dashboard .premium-grades-panel {
  @apply tw:w-full;
  @apply tw:max-w-none;
  @apply tw:[min-height:auto];
  @apply tw:[margin:0_auto];
  @apply tw:[padding:0];
  @apply tw:overflow-visible;
  @apply tw:[border:0];
  @apply tw:rounded-none;
  @apply tw:[background:transparent];
  @apply tw:[box-shadow:none];
  @apply tw:[animation:grades-fade-up_420ms_ease_both];
}

.grades-premium-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1.5rem];
  @apply tw:[margin-bottom:1.5rem];
  @apply tw:[padding-bottom:1.25rem];
  @apply tw:[border-bottom:1px_solid_rgba(79,_125,_58,_0.13)];
}

.grades-premium-header__copy {
  @apply tw:[max-width:44rem];
}

.premium-dashboard .grades-premium-header h1 {
  @apply tw:[margin:0.3rem_0_0.35rem];
  @apply tw:[color:#17350a];
  @apply tw:[font-size:clamp(1.8rem,_3vw,_2.4rem)];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:-0.045em];
  @apply tw:[line-height:1.08];
}

.premium-dashboard .grades-premium-header p {
  @apply tw:[max-width:42rem];
  @apply tw:[color:#667661];
  @apply tw:[font-size:clamp(0.9rem,_1.4vw,_1rem)];
  @apply tw:[line-height:1.5];
}

.grades-back-button {
  @apply tw:inline-flex;
  @apply tw:flex-none;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[min-height:2.9rem];
  @apply tw:[padding:0.7rem_1rem];
  @apply tw:[color:#365f25];
  @apply tw:[border:1px_solid_rgba(79,_125,_58,_0.22)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.7)];
  @apply tw:[box-shadow:0_5px_14px_rgba(30,_67,_7,_0.05)];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:780];
  @apply tw:[backdrop-filter:blur(12px)];
  @apply tw:[transition:gap_180ms_ease,_color_180ms_ease,_background_180ms_ease,_box-shadow_180ms_ease,_transform_180ms_ease];
}

.grades-back-button:hover {
  @apply tw:[gap:0.85rem];
  @apply tw:[color:#fff];
  @apply tw:[background:#1e4307];
  @apply tw:[box-shadow:0_10px_24px_rgba(30,_67,_7,_0.17)];
  @apply tw:[transform:translateY(-2px)];
}

.grades-stat-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(4,_minmax(0,_1fr))];
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1.25rem];
}

.grades-stat-card {
  --grade-stat-accent: #4f7d3a;
  --grade-stat-wash: #eef5e9;
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.7rem];
  @apply tw:items-start;
  @apply tw:[min-height:7rem];
  @apply tw:[padding:1rem];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_rgba(79,_125,_58,_0.14)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:rgba(255,_255,_255,_0.84)];
  @apply tw:[box-shadow:0_8px_24px_rgba(30,_67,_7,_0.06)];
  @apply tw:[backdrop-filter:blur(10px)];
  @apply tw:[transition:border-color_200ms_ease,_box-shadow_200ms_ease,_transform_200ms_ease];
}

.grades-stat-card::after {
  @apply tw:absolute;
  @apply tw:[right:-2rem];
  @apply tw:[bottom:-2.8rem];
  @apply tw:[width:7rem];
  @apply tw:[height:7rem];
  @apply tw:[border-radius:50%];
  @apply tw:[background:var(--grade-stat-wash)];
  @apply tw:[content:""];
  @apply tw:[opacity:0.72];
}

.grades-stat-card:hover {
  @apply tw:[border-color:rgba(79,_125,_58,_0.3)];
  @apply tw:[box-shadow:0_16px_32px_rgba(30,_67,_7,_0.1)];
  @apply tw:[transform:translateY(-4px)];
}

.grades-stat-card--forest { --grade-stat-accent: #1e4307; --grade-stat-wash: #dcead3; }
.grades-stat-card--sage { --grade-stat-accent: #6f9d58; --grade-stat-wash: #e7f1e1; }
.grades-stat-card--gold { --grade-stat-accent: #9b741f; --grade-stat-wash: #f8ebc9; }
.grades-stat-card--teal { --grade-stat-accent: #3f7768; --grade-stat-wash: #dcefe8; }

.grades-stat-card__icon {
  @apply tw:grid;
  @apply tw:[width:2.7rem];
  @apply tw:[height:2.7rem];
  @apply tw:place-items-center;
  @apply tw:[color:var(--grade-stat-accent)];
  @apply tw:[border-radius:14px];
  @apply tw:[background:var(--grade-stat-wash)];
  @apply tw:[font-size:1.08rem];
}

.grades-stat-card > div {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:[min-width:0];
}

.grades-stat-card > div > span {
  @apply tw:block;
  @apply tw:[color:#6e7c69];
  @apply tw:[font-size:0.69rem];
  @apply tw:[font-weight:750];
  @apply tw:[line-height:1.3];
}

.grades-stat-card strong {
  @apply tw:block;
  @apply tw:[margin-top:0.28rem];
  @apply tw:[color:#18320d];
  @apply tw:[font-size:clamp(1.5rem,_2.5vw,_2rem)];
  @apply tw:[font-weight:820];
  @apply tw:[letter-spacing:-0.045em];
  @apply tw:[line-height:1.1];
}

.grades-stat-card small {
  @apply tw:block;
  @apply tw:[margin-top:0.35rem];
  @apply tw:[color:#7b8877];
  @apply tw:[font-size:0.62rem];
  @apply tw:[line-height:1.4];
}

.grades-stat-card--skeleton {
  @apply tw:items-center;
  @apply tw:pointer-events-none;
}

.grades-stat-card--skeleton > div {
  @apply tw:grid;
  @apply tw:[gap:0.6rem];
  @apply tw:w-full;
}

.grades-content-skeleton {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(12rem,_0.7fr)_minmax(0,_1.3fr)];
  @apply tw:[gap:2rem];
  @apply tw:items-center;
  @apply tw:[min-height:22rem];
  @apply tw:[padding:2rem];
  @apply tw:[border:1px_solid_#e1ebdc];
  @apply tw:[border-radius:20px];
  @apply tw:[background:rgba(249,_252,_247,_0.86)];
}

.grades-content-skeleton__visual {
  @apply tw:w-full;
  @apply tw:[height:16rem];
}

.grades-content-skeleton > div {
  @apply tw:grid;
  @apply tw:[gap:0.8rem];
}

.grades-content-skeleton__button {
  @apply tw:[width:9rem];
  @apply tw:[height:2.7rem];
  @apply tw:[margin-top:0.6rem];
}

.grades-results-dashboard {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(15rem,_0.62fr)_minmax(0,_1.38fr)];
  @apply tw:[gap:1.25rem];
  @apply tw:items-stretch;
}

.grades-performance-card {
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:justify-center;
  @apply tw:[min-height:23rem];
  @apply tw:[padding:clamp(1.5rem,_3vw,_2.2rem)];
  @apply tw:[color:#fff];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.14)];
  @apply tw:[border-radius:20px];
  @apply tw:[background:radial-gradient(circle_at_90%_8%,_rgba(220,_234,_211,_0.22),_transparent_12rem),______linear-gradient(145deg,_#173806,_#4f7d3a)];
  @apply tw:[box-shadow:0_18px_40px_rgba(30,_67,_7,_0.19)];
}

.grades-performance-card__eyebrow {
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.1em];
  @apply tw:uppercase;
}

.grades-performance-card > strong {
  @apply tw:[margin-top:0.5rem];
  @apply tw:[color:#fff];
  @apply tw:[font-size:clamp(3rem,_6vw,_4.5rem)];
  @apply tw:[font-weight:850];
  @apply tw:[letter-spacing:-0.065em];
  @apply tw:[line-height:1];
}

.premium-dashboard .grades-performance-card > p {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[margin-top:0.8rem];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:0.8rem];
}

.grades-performance-card__track {
  @apply tw:[height:0.55rem];
  @apply tw:[margin-top:1.5rem];
  @apply tw:overflow-hidden;
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.15)];
}

.grades-performance-card__track span {
  @apply tw:block;
  @apply tw:h-full;
  @apply tw:[border-radius:inherit];
  @apply tw:[background:#dcead3];
  @apply tw:[transition:width_600ms_ease];
}

.grades-performance-card > small {
  @apply tw:[margin-top:0.65rem];
  @apply tw:[color:#ffffff];
  @apply tw:[font-size:0.65rem];
}

.grades-performance-card > p i {
  @apply tw:[color:#ffffff];
}

.premium-dashboard .grades-performance-card :is(span, strong, p, small, i) {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.grades-results-feed {
  @apply tw:[min-width:0];
  @apply tw:[padding:clamp(1.25rem,_2.5vw,_1.75rem)];
  @apply tw:[border:1px_solid_#e0eadb];
  @apply tw:[border-radius:20px];
  @apply tw:[background:rgba(255,_255,_255,_0.8)];
  @apply tw:[box-shadow:0_8px_24px_rgba(30,_67,_7,_0.05)];
}

.grades-results-feed__heading {
  @apply tw:flex;
  @apply tw:items-center;
  @apply tw:justify-between;
  @apply tw:[gap:1rem];
  @apply tw:[margin-bottom:1rem];
}

.grades-results-feed__heading h2 {
  @apply tw:[margin-top:0.2rem];
  @apply tw:[color:#18320d];
  @apply tw:[font-size:1.25rem];
}

.grades-result-count {
  @apply tw:[padding:0.45rem_0.65rem];
  @apply tw:[color:#416d30];
  @apply tw:[border-radius:999px];
  @apply tw:[background:#e7f1e1];
  @apply tw:[font-size:0.66rem];
  @apply tw:[font-weight:800];
}

.grades-premium-empty {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(11rem,_0.46fr)_minmax(0,_1fr)];
  @apply tw:[gap:clamp(1.25rem,_3vw,_2.25rem)];
  @apply tw:items-center;
  @apply tw:[min-height:18rem];
  @apply tw:[padding:clamp(1.5rem,_3vw,_2.25rem)];
  @apply tw:overflow-hidden;
  @apply tw:[border:1px_solid_rgba(79,_125,_58,_0.18)];
  @apply tw:[border-radius:20px];
  @apply tw:[background:radial-gradient(circle_at_14%_50%,_rgba(220,_234,_211,_0.75),_transparent_18rem),______linear-gradient(135deg,_rgba(247,_251,_244,_0.98),_rgba(255,_255,_255,_0.94))];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.9),_0_14px_34px_rgba(30,_67,_7,_0.07)];
}

.grades-premium-empty__visual {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[min-height:12rem];
  @apply tw:place-items-center;
}

.grades-visual-orbit {
  @apply tw:absolute;
  @apply tw:[width:11.5rem];
  @apply tw:[height:11.5rem];
  @apply tw:[border:1px_dashed_rgba(79,_125,_58,_0.28)];
  @apply tw:[border-radius:50%];
}

.grades-visual-orbit::before,
.grades-visual-orbit::after {
  @apply tw:absolute;
  @apply tw:[border-radius:50%];
  @apply tw:[background:#6f9d58];
  @apply tw:[box-shadow:0_0_0_6px_rgba(111,_157,_88,_0.13)];
  @apply tw:[content:""];
}

.grades-visual-orbit::before {
  @apply tw:[top:1.5rem];
  @apply tw:[left:1rem];
  @apply tw:[width:0.65rem];
  @apply tw:[height:0.65rem];
}

.grades-visual-orbit::after {
  @apply tw:[right:1rem];
  @apply tw:[bottom:2rem];
  @apply tw:[width:0.45rem];
  @apply tw:[height:0.45rem];
}

.grades-visual-sheet {
  @apply tw:[z-index:1];
  @apply tw:grid;
  @apply tw:[width:7.5rem];
  @apply tw:[min-height:8.8rem];
  @apply tw:place-items-center;
  @apply tw:[padding:1.25rem];
  @apply tw:[color:#1e4307];
  @apply tw:[border:1px_solid_rgba(79,_125,_58,_0.17)];
  @apply tw:[border-radius:24px_24px_24px_8px];
  @apply tw:[background:rgba(255,_255,_255,_0.92)];
  @apply tw:[box-shadow:0_22px_45px_rgba(30,_67,_7,_0.16)];
  @apply tw:[font-size:2rem];
  @apply tw:[transform:rotate(-3deg)];
}

.grades-visual-sheet > span {
  @apply tw:flex;
  @apply tw:[gap:0.35rem];
  @apply tw:items-end;
  @apply tw:w-full;
  @apply tw:[height:2.8rem];
}

.grades-visual-sheet b {
  @apply tw:[flex:1];
  @apply tw:[border-radius:4px_4px_2px_2px];
  @apply tw:[background:#dcead3];
}

.grades-visual-sheet b:nth-child(1) { @apply tw:[height:42%]; }
.grades-visual-sheet b:nth-child(2) { @apply tw:[height:70%]; @apply tw:[background:#6f9d58]; }
.grades-visual-sheet b:nth-child(3) { @apply tw:h-full; @apply tw:[background:#1e4307]; }

.grades-visual-badge {
  @apply tw:absolute;
  @apply tw:[z-index:2];
  @apply tw:[top:0.75rem];
  @apply tw:[right:calc(50%_-_5.5rem)];
  @apply tw:grid;
  @apply tw:[width:2.6rem];
  @apply tw:[height:2.6rem];
  @apply tw:place-items-center;
  @apply tw:[color:#fff];
  @apply tw:[border:5px_solid_#f5faf2];
  @apply tw:[border-radius:50%];
  @apply tw:[background:#4f7d3a];
  @apply tw:[box-shadow:0_10px_22px_rgba(30,_67,_7,_0.2)];
  @apply tw:[animation:premium-float_4.8s_ease-in-out_infinite];
}

.grades-visual-badge i {
  @apply tw:[color:#fff]!;
  @apply tw:[-webkit-text-fill-color:#fff]!;
}

.grades-premium-empty__copy {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:[max-width:38rem];
}

.premium-dashboard .grades-premium-empty__copy h2 {
  @apply tw:[margin:0.35rem_0_0.5rem];
  @apply tw:[color:#18320d];
  @apply tw:[font-size:clamp(1.65rem,_2.8vw,_2.2rem)];
  @apply tw:[font-weight:820];
  @apply tw:[letter-spacing:-0.045em];
  @apply tw:[line-height:1.1];
}

.premium-dashboard .grades-premium-empty__copy > p {
  @apply tw:[color:#657361];
  @apply tw:[font-size:clamp(0.88rem,_1.5vw,_1rem)];
  @apply tw:[line-height:1.55];
}

.grades-empty-guidance {
  @apply tw:flex;
  @apply tw:flex-wrap;
  @apply tw:[gap:0.65rem_1rem];
  @apply tw:[margin:0.8rem_0_1rem];
}

.grades-empty-guidance span {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.4rem];
  @apply tw:[color:#4c6144];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:680];
}

.grades-empty-guidance i {
  @apply tw:[color:#6f9d58];
}

.grades-primary-button {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[min-height:3rem];
  @apply tw:[padding:0.75rem_1.15rem];
  @apply tw:[color:#fff]!;
  @apply tw:[-webkit-text-fill-color:#fff]!;
  @apply tw:[border-radius:12px];
  @apply tw:[background:linear-gradient(135deg,_#4f8a35,_#4f7d3a)];
  @apply tw:[box-shadow:0_10px_24px_rgba(30,_67,_7,_0.2)];
  @apply tw:[font-size:0.8rem];
  @apply tw:[font-weight:800];
  @apply tw:[transition:gap_180ms_ease,_box-shadow_180ms_ease,_transform_180ms_ease];
}

.grades-primary-button span,
.grades-primary-button i {
  @apply tw:[color:#fff]!;
  @apply tw:[-webkit-text-fill-color:#fff]!;
}

.grades-primary-button:hover {
  @apply tw:[gap:0.85rem];
  @apply tw:[box-shadow:0_14px_30px_rgba(30,_67,_7,_0.25)];
  @apply tw:[transform:translateY(-2px)];
}

@keyframes grades-fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1100px) {
  .grades-stat-grid {
    @apply tw:[grid-template-columns:repeat(2,_minmax(0,_1fr))];
  }

  .grades-results-dashboard {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .grades-performance-card {
    @apply tw:[min-height:17rem];
  }
}

@media (max-width: 800px) {
  .grades-premium-empty {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
    @apply tw:[gap:0.75rem];
  }

  .grades-premium-empty__visual {
    @apply tw:[min-height:11rem];
  }
}

@media (max-width: 700px) {
  .grades-premium-header {
    @apply tw:flex-col;
    @apply tw:[gap:1rem];
    @apply tw:[margin-bottom:1.25rem];
  }

  .grades-back-button {
    @apply tw:w-full;
    @apply tw:justify-center;
  }

  .grades-stat-grid {
    @apply tw:[gap:0.65rem];
  }

  .grades-stat-card {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
    @apply tw:[gap:0.55rem];
    @apply tw:[min-height:8.4rem];
    @apply tw:[padding:0.85rem];
  }

  .grades-stat-card__icon {
    @apply tw:[width:2.3rem];
    @apply tw:[height:2.3rem];
    @apply tw:[border-radius:11px];
  }

  .grades-stat-card strong {
    @apply tw:[font-size:1.55rem];
  }

  .grades-content-skeleton {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
    @apply tw:[min-height:auto];
    @apply tw:[padding:1.25rem];
  }

  .grades-content-skeleton__visual {
    @apply tw:[height:10rem];
  }

  .grades-premium-empty {
    @apply tw:[gap:1rem];
    @apply tw:[min-height:auto];
    @apply tw:[padding:1.5rem];
    @apply tw:text-center;
  }

  .grades-premium-empty__visual {
    @apply tw:[min-height:10rem];
    @apply tw:[transform:scale(0.78)];
  }

  .grades-premium-empty__copy .premium-eyebrow,
  .grades-empty-guidance {
    @apply tw:justify-center;
  }

  .grades-primary-button {
    @apply tw:w-full;
  }

  .grades-results-feed__heading {
    @apply tw:items-start;
  }
}

@media (max-width: 380px) {
  .grades-stat-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .grades-stat-card {
    @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
    @apply tw:[min-height:6.5rem];
  }
}

/* Focused Personalized Pathway — isolated from the grades view. */
/* Grade view: phone-first refinements and a non-scrolling record layout. */
@media (max-width: 640px) {
  .premium-dashboard .premium-grades-panel { @apply tw:w-full; @apply tw:[min-width:0]; }
  .grades-premium-header { @apply tw:[gap:0.8rem]; @apply tw:[margin-bottom:1rem]; @apply tw:[padding-bottom:1rem]; }
  .grades-premium-header__copy { @apply tw:w-full; @apply tw:[min-width:0]; }
  .premium-dashboard .grades-premium-header h1 { @apply tw:[font-size:clamp(1.55rem,_8vw,_1.9rem)]; @apply tw:[overflow-wrap:anywhere]; }
  .premium-dashboard .grades-premium-header p { @apply tw:[font-size:0.86rem]; }
  .grades-stat-grid { @apply tw:[grid-template-columns:minmax(0,_1fr)]; }
  .grades-stat-card,
  .grades-stat-card.grades-stat-card--skeleton { @apply tw:[grid-template-columns:auto_minmax(0,_1fr)]; @apply tw:[min-height:6.4rem]; @apply tw:[padding:0.9rem]; }
  .grades-premium-empty { @apply tw:[padding:1.1rem]; @apply tw:[border-radius:16px]; }
  .grades-premium-empty__visual { @apply tw:[min-height:8.5rem]; @apply tw:[margin:-1rem_0]; @apply tw:[transform:scale(0.7)]; }
  .grades-empty-guidance { @apply tw:grid; @apply tw:[grid-template-columns:minmax(0,_1fr)]; @apply tw:justify-items-start; @apply tw:text-left; }
  .grades-premium-empty__copy .premium-eyebrow { @apply tw:justify-center; }

  .complete-grade-history { @apply tw:[padding:0.85rem]; @apply tw:[border-radius:16px]; }
  .complete-grade-history > header { @apply tw:[gap:0.55rem]; @apply tw:[margin-bottom:0.75rem]; }
  .complete-grade-history > header > p { @apply tw:max-w-none; @apply tw:[font-size:0.7rem]; }
  .complete-grade-history__table-wrap { @apply tw:overflow-visible; @apply tw:[border:0]; @apply tw:rounded-none; }
  .complete-grade-history table,
  .complete-grade-history tbody,
  .complete-grade-history tr,
  .complete-grade-history th,
  .complete-grade-history td { @apply tw:block; @apply tw:w-full; @apply tw:[min-width:0]; }
  .complete-grade-history table { @apply tw:[min-width:0]; }
  .complete-grade-history thead { @apply tw:absolute; @apply tw:[width:1px]; @apply tw:[height:1px]; @apply tw:overflow-hidden; @apply tw:[clip:rect(0_0_0_0)]; @apply tw:[clip-path:inset(50%)]; @apply tw:whitespace-nowrap; }
  .complete-grade-history tbody { @apply tw:grid; @apply tw:[gap:0.75rem]; }
  .complete-grade-history tbody tr { @apply tw:overflow-hidden; @apply tw:[border:1px_solid_#dfe8d8]; @apply tw:[border-radius:14px]; @apply tw:[background:#fff]; @apply tw:[box-shadow:0_5px_14px_rgba(30,_67,_7,_0.05)]; }
  .complete-grade-history tbody th,
  .complete-grade-history tbody td { @apply tw:relative; @apply tw:[min-height:3.25rem]; @apply tw:[padding:0.7rem_0.75rem_0.7rem_42%]; @apply tw:[border-bottom:1px_solid_#edf1e9]; @apply tw:text-right; }
  .complete-grade-history tbody th { @apply tw:[padding-left:0.75rem]; @apply tw:[background:#f7faf3]; @apply tw:text-left; }
  .complete-grade-history tbody td::before { @apply tw:absolute; @apply tw:[top:50%]; @apply tw:[left:0.75rem]; @apply tw:[max-width:36%]; @apply tw:[color:#60705c]; @apply tw:[content:attr(data-label)]; @apply tw:[font-size:0.68rem]; @apply tw:[font-weight:800]; @apply tw:[letter-spacing:0.04em]; @apply tw:text-left; @apply tw:uppercase; @apply tw:[transform:translateY(-50%)]; }
  .complete-grade-history td.is-final { @apply tw:[background:#eef8ec]; }
}

@media (max-width: 420px) {
  .premium-dashboard .premium-grades-panel { @apply tw:[padding-inline:0]; }
  .grades-back-button,
  .grades-primary-button { @apply tw:[min-height:2.75rem]; @apply tw:[padding-inline:0.85rem]; }
  .grades-premium-empty__visual { @apply tw:[transform:scale(0.62)]; }
}

.premium-dashboard .premium-pathway-panel {
  @apply tw:w-full;
  @apply tw:max-w-none;
  @apply tw:[min-height:auto];
  @apply tw:[margin:0_auto];
  @apply tw:[padding:clamp(1.25rem,_2.2vw,_1.75rem)];
  @apply tw:overflow-hidden;
  @apply tw:[border:0];
  @apply tw:rounded-none;
  @apply tw:[background:transparent];
  @apply tw:[box-shadow:none];
  @apply tw:[animation:grades-fade-up_420ms_ease_both];
}

.pathway-premium-header {
  @apply tw:flex;
  @apply tw:items-start;
  @apply tw:justify-between;
  @apply tw:[gap:1.5rem];
  @apply tw:[margin-bottom:1.1rem];
  @apply tw:[padding-bottom:1rem];
  @apply tw:[border-bottom:1px_solid_rgba(79,_125,_58,_0.13)];
}

.pathway-premium-header__copy {
  @apply tw:[max-width:46rem];
}

.premium-dashboard .pathway-premium-header h1 {
  @apply tw:[margin:0.3rem_0_0.35rem];
  @apply tw:[color:#17350a];
  @apply tw:[font-size:clamp(1.8rem,_3vw,_2.4rem)];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:-0.045em];
  @apply tw:[line-height:1.08];
}

.premium-dashboard .pathway-premium-header p {
  @apply tw:[max-width:43rem];
  @apply tw:[color:#667661];
  @apply tw:[font-size:clamp(0.9rem,_1.4vw,_1rem)];
  @apply tw:[line-height:1.5];
}

.pathway-back-button {
  @apply tw:inline-flex;
  @apply tw:flex-none;
  @apply tw:items-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[min-height:2.9rem];
  @apply tw:[padding:0.7rem_1rem];
  @apply tw:[color:#365f25];
  @apply tw:[border:1px_solid_rgba(79,_125,_58,_0.22)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.72)];
  @apply tw:[box-shadow:0_5px_14px_rgba(30,_67,_7,_0.05)];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:780];
  @apply tw:[backdrop-filter:blur(12px)];
  @apply tw:[transition:gap_180ms_ease,_color_180ms_ease,_background_180ms_ease,_box-shadow_180ms_ease,_transform_180ms_ease];
}

.pathway-back-button:hover {
  @apply tw:[gap:0.85rem];
  @apply tw:[color:#fff];
  @apply tw:[background:#1e4307];
  @apply tw:[box-shadow:0_10px_24px_rgba(30,_67,_7,_0.17)];
  @apply tw:[transform:translateY(-2px)];
}

.pathway-hero {
  @apply tw:relative;
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1.45fr)_minmax(17rem,_0.55fr)];
  @apply tw:[gap:clamp(1.5rem,_3vw,_2.5rem)];
  @apply tw:items-center;
  @apply tw:[min-height:19rem];
  @apply tw:[padding:clamp(1.25rem,_3vw,_2rem)];
  @apply tw:overflow-hidden;
  @apply tw:[color:#fff];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.14)];
  @apply tw:[border-radius:20px];
  @apply tw:[background:radial-gradient(circle_at_78%_15%,_rgba(180,_216,_158,_0.23),_transparent_18rem),______linear-gradient(128deg,_#4f8a35_0%,_#245f00_52%,_#144300_100%)];
  @apply tw:[box-shadow:0_20px_46px_rgba(30,_67,_7,_0.2)];
}

.pathway-hero::before {
  @apply tw:absolute;
  @apply tw:[top:-8rem];
  @apply tw:[right:-5rem];
  @apply tw:[width:25rem];
  @apply tw:[height:25rem];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.1)];
  @apply tw:[border-radius:50%];
  @apply tw:[content:""];
}

.pathway-hero__copy {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:[max-width:48rem];
}

.pathway-status {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:[gap:0.45rem];
  @apply tw:[padding:0.5rem_0.68rem];
  @apply tw:[color:#fff];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.2)];
  @apply tw:[border-radius:999px];
  @apply tw:[background:rgba(255,_255,_255,_0.11)];
  @apply tw:[font-size:0.7rem];
  @apply tw:[font-weight:800];
  @apply tw:[backdrop-filter:blur(10px)];
}

.pathway-status--ready {
  @apply tw:[color:#1e4307];
  @apply tw:[background:#dcead3];
}

.premium-dashboard .pathway-hero__copy h2 {
  @apply tw:[max-width:42rem];
  @apply tw:[margin-top:0.65rem];
  @apply tw:[color:#fff]!;
  @apply tw:[-webkit-text-fill-color:#fff]!;
  @apply tw:[font-size:clamp(1.75rem,_3vw,_2.5rem)];
  @apply tw:[font-weight:820];
  @apply tw:[letter-spacing:-0.05em];
  @apply tw:[line-height:1.08];
}

.premium-dashboard .pathway-hero__copy > p {
  @apply tw:[max-width:39rem];
  @apply tw:[margin-top:0.5rem];
  @apply tw:[color:#e4efde]!;
  @apply tw:[-webkit-text-fill-color:#e4efde]!;
  @apply tw:[font-size:clamp(0.9rem,_1.5vw,_1rem)];
  @apply tw:[line-height:1.5];
}

.pathway-milestone {
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.7rem];
  @apply tw:[max-width:42rem];
  @apply tw:[margin-top:0.8rem];
  @apply tw:[padding:0.8rem];
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.14)];
  @apply tw:[border-radius:15px];
  @apply tw:[background:rgba(255,_255,_255,_0.08)];
  @apply tw:[backdrop-filter:blur(10px)];
}

.pathway-milestone__icon {
  @apply tw:grid;
  @apply tw:[width:2.4rem];
  @apply tw:[height:2.4rem];
  @apply tw:place-items-center;
  @apply tw:[color:#1e4307];
  @apply tw:[border-radius:11px];
  @apply tw:[background:#dcead3];
}

.pathway-milestone strong {
  @apply tw:[color:#fff];
  @apply tw:[font-size:0.82rem];
}

.premium-dashboard .pathway-milestone p {
  @apply tw:[margin-top:0.25rem];
  @apply tw:[color:rgba(255,_255,_255,_0.72)]!;
  @apply tw:[-webkit-text-fill-color:rgba(255,_255,_255,_0.72)]!;
  @apply tw:[font-size:0.7rem];
  @apply tw:[line-height:1.55];
}

.pathway-primary-button {
  @apply tw:inline-flex;
  @apply tw:items-center;
  @apply tw:justify-center;
  @apply tw:[gap:0.65rem];
  @apply tw:[min-height:2.75rem];
  @apply tw:[margin-top:0.8rem];
  @apply tw:[padding:0.65rem_1.05rem];
  @apply tw:[color:#1e4307];
  @apply tw:[border-radius:12px];
  @apply tw:[background:#dcead3];
  @apply tw:[box-shadow:0_12px_26px_rgba(7,_30,_1,_0.22)];
  @apply tw:[font-size:0.78rem];
  @apply tw:[font-weight:820];
  @apply tw:[transition:gap_180ms_ease,_background_180ms_ease,_box-shadow_180ms_ease,_transform_180ms_ease];
}

.pathway-primary-button:hover {
  @apply tw:[gap:0.85rem];
  @apply tw:[background:#fff];
  @apply tw:[box-shadow:0_16px_32px_rgba(7,_30,_1,_0.27)];
  @apply tw:[transform:translateY(-2px)];
}

.pathway-progress-card {
  @apply tw:relative;
  @apply tw:[z-index:1];
  @apply tw:flex;
  @apply tw:flex-col;
  @apply tw:items-center;
  @apply tw:[padding:1rem];
  @apply tw:text-center;
  @apply tw:[border:1px_solid_rgba(255,_255,_255,_0.17)];
  @apply tw:[border-radius:20px];
  @apply tw:[background:rgba(255,_255,_255,_0.1)];
  @apply tw:[box-shadow:inset_0_1px_0_rgba(255,_255,_255,_0.12)];
  @apply tw:[backdrop-filter:blur(14px)];
}

.pathway-progress-card__label {
  @apply tw:[color:#dcefd2];
  @apply tw:[font-size:0.66rem];
  @apply tw:[font-weight:800];
  @apply tw:[letter-spacing:0.09em];
  @apply tw:uppercase;
}

.pathway-progress-ring {
  @apply tw:grid;
  @apply tw:[width:8rem];
  @apply tw:[height:8rem];
  @apply tw:[margin:0.7rem_0];
  @apply tw:place-items-center;
  @apply tw:[border-radius:50%];
  @apply tw:[background:conic-gradient(#dcead3_var(--pathway-progress),_rgba(255,_255,_255,_0.14)_0deg)];
  @apply tw:[box-shadow:0_14px_30px_rgba(8,_32,_2,_0.2)];
}

.pathway-progress-ring::before {
  @apply tw:[grid-area:1_/_1];
  @apply tw:[width:6.1rem];
  @apply tw:[height:6.1rem];
  @apply tw:[border-radius:50%];
  @apply tw:[background:rgba(24,_60,_8,_0.93)];
  @apply tw:[box-shadow:inset_0_0_0_1px_rgba(255,_255,_255,_0.1)];
  @apply tw:[content:""];
}

.pathway-progress-ring > div {
  @apply tw:[z-index:1];
  @apply tw:grid;
  @apply tw:[grid-area:1_/_1];
}

.pathway-progress-ring strong {
  @apply tw:[color:#fff];
  @apply tw:[font-size:1.8rem];
  @apply tw:[letter-spacing:-0.055em];
}

.pathway-progress-ring span {
  @apply tw:[color:rgba(255,_255,_255,_0.7)];
  @apply tw:[font-size:0.65rem];
  @apply tw:[font-weight:700];
}

.pathway-progress-card__strand {
  @apply tw:max-w-full;
  @apply tw:[color:#fff];
  @apply tw:[font-size:1rem];
  @apply tw:[overflow-wrap:anywhere];
}

.premium-dashboard .pathway-progress-card > p {
  @apply tw:[margin-top:0.35rem];
  @apply tw:[color:rgba(255,_255,_255,_0.68)]!;
  @apply tw:[-webkit-text-fill-color:rgba(255,_255,_255,_0.68)]!;
  @apply tw:[font-size:0.67rem];
  @apply tw:[line-height:1.5];
}

.premium-dashboard .premium-pathway-panel .pathway-status,
.premium-dashboard .premium-pathway-panel .pathway-status i,
.premium-dashboard .premium-pathway-panel .pathway-milestone strong,
.premium-dashboard .premium-pathway-panel .pathway-progress-card__label,
.premium-dashboard .premium-pathway-panel .pathway-progress-ring strong,
.premium-dashboard .premium-pathway-panel .pathway-progress-ring span,
.premium-dashboard .premium-pathway-panel .pathway-progress-card__strand,
.premium-dashboard .premium-pathway-panel .pathway-progress-card > p {
  @apply tw:[color:#ffffff]!;
  @apply tw:[-webkit-text-fill-color:#ffffff]!;
}

.pathway-stat-grid {
  @apply tw:grid;
  @apply tw:[grid-template-columns:repeat(6,_minmax(0,_1fr))];
  @apply tw:[gap:0.7rem];
  @apply tw:[margin-top:0.8rem];
}

.pathway-stat-card {
  --path-stat-accent: #4f7d3a;
  --path-stat-wash: #e7f1e1;
  @apply tw:grid;
  @apply tw:[grid-template-columns:auto_minmax(0,_1fr)];
  @apply tw:[gap:0.7rem];
  @apply tw:[min-height:6.8rem];
  @apply tw:[padding:0.8rem];
  @apply tw:[border:1px_solid_rgba(79,_125,_58,_0.14)];
  @apply tw:[border-radius:18px];
  @apply tw:[background:rgba(255,_255,_255,_0.86)];
  @apply tw:[box-shadow:0_8px_22px_rgba(30,_67,_7,_0.055)];
  @apply tw:[backdrop-filter:blur(10px)];
  @apply tw:[transition:border-color_200ms_ease,_box-shadow_200ms_ease,_transform_200ms_ease];
}

.pathway-stat-card:hover {
  @apply tw:[border-color:rgba(79,_125,_58,_0.3)];
  @apply tw:[box-shadow:0_15px_30px_rgba(30,_67,_7,_0.1)];
  @apply tw:[transform:translateY(-4px)];
}

.pathway-stat-card--forest { --path-stat-accent: #1e4307; --path-stat-wash: #dcead3; }
.pathway-stat-card--sage { --path-stat-accent: #6f9d58; --path-stat-wash: #e7f1e1; }
.pathway-stat-card--teal { --path-stat-accent: #3f7768; --path-stat-wash: #dcefe8; }
.pathway-stat-card--success { --path-stat-accent: #40823b; --path-stat-wash: #e1f1dd; }
.pathway-stat-card--blue { --path-stat-accent: #52758c; --path-stat-wash: #e4eef3; }
.pathway-stat-card--gold { --path-stat-accent: #967019; --path-stat-wash: #f7eac8; }

.pathway-stat-card__icon {
  @apply tw:grid;
  @apply tw:[width:2.4rem];
  @apply tw:[height:2.4rem];
  @apply tw:place-items-center;
  @apply tw:[color:var(--path-stat-accent)];
  @apply tw:[border-radius:12px];
  @apply tw:[background:var(--path-stat-wash)];
  @apply tw:[font-size:0.95rem];
}

.pathway-stat-card > div {
  @apply tw:[min-width:0];
}

.pathway-stat-card > div > span {
  @apply tw:block;
  @apply tw:[color:#71806c];
  @apply tw:[font-size:0.62rem];
  @apply tw:[font-weight:750];
  @apply tw:[line-height:1.35];
}

.pathway-stat-card strong {
  @apply tw:block;
  @apply tw:[margin-top:0.3rem];
  @apply tw:overflow-hidden;
  @apply tw:[color:#18320d];
  @apply tw:[font-size:clamp(1rem,_1.8vw,_1.35rem)];
  @apply tw:[font-weight:820];
  @apply tw:[line-height:1.2];
  @apply tw:[overflow-wrap:anywhere];
}

.pathway-stat-card small {
  @apply tw:block;
  @apply tw:[margin-top:0.3rem];
  @apply tw:[color:#7f8b7b];
  @apply tw:[font-size:0.57rem];
  @apply tw:[line-height:1.4];
}

.pathway-stat-card--skeleton {
  @apply tw:pointer-events-none;
}

.pathway-stat-card--skeleton > div {
  @apply tw:grid;
  @apply tw:[gap:0.55rem];
  @apply tw:w-full;
}

.pathway-loading {
  @apply tw:grid;
  @apply tw:[grid-template-columns:minmax(0,_1fr)_13rem];
  @apply tw:[gap:2rem];
  @apply tw:items-center;
  @apply tw:[min-height:25rem];
  @apply tw:[padding:2.5rem];
  @apply tw:[border:1px_solid_#e1ebdc];
  @apply tw:[border-radius:20px];
  @apply tw:[background:#f8fbf6];
}

.pathway-loading > div {
  @apply tw:grid;
  @apply tw:[gap:0.9rem];
}

.pathway-loading__ring {
  @apply tw:[width:12rem];
  @apply tw:[height:12rem];
  @apply tw:[border-radius:50%];
}

@media (max-width: 1180px) {
  .pathway-stat-grid {
    @apply tw:[grid-template-columns:repeat(3,_minmax(0,_1fr))];
  }
}

@media (max-width: 900px) {
  .pathway-hero {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .pathway-progress-card {
    @apply tw:[max-width:28rem];
    @apply tw:w-full;
    @apply tw:[margin:0_auto];
  }
}

@media (max-width: 700px) {
  .premium-dashboard .premium-pathway-panel {
    @apply tw:[padding:1.25rem];
  }

  .pathway-premium-header {
    @apply tw:flex-col;
    @apply tw:[gap:1rem];
    @apply tw:[margin-bottom:1.25rem];
  }

  .pathway-back-button,
  .pathway-primary-button {
    @apply tw:w-full;
    @apply tw:justify-center;
  }

  .pathway-hero {
    @apply tw:[gap:1.5rem];
    @apply tw:[min-height:auto];
    @apply tw:[padding:1.5rem];
  }

  .pathway-milestone {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .pathway-stat-grid {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
  }

  .pathway-stat-card {
    @apply tw:[min-height:7.6rem];
  }

  .pathway-loading {
    @apply tw:[grid-template-columns:minmax(0,_1fr)];
    @apply tw:[min-height:auto];
    @apply tw:[padding:1.5rem];
  }

  .pathway-loading__ring {
    @apply tw:[width:9rem];
    @apply tw:[height:9rem];
    @apply tw:[margin:0_auto];
  }
}

@media (prefers-reduced-motion: reduce) {
  .premium-dashboard *,
  .premium-dashboard *::before,
  .premium-dashboard *::after {
    @apply tw:scroll-auto!;
    @apply tw:[animation-duration:0.01ms]!;
    @apply tw:[animation-iteration-count:1]!;
    @apply tw:[transition-duration:0.01ms]!;
  }
}


</style>
