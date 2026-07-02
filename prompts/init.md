# Questionnaire Web App

## Overview

A questionnaire creator web app where users can create and answer quiz and surveys

## Tech stack

### Frontend

- Vite + React JS
- Shadcn
- Tailwind
- Tanstack Query
- Tanstack Form
- Tanstack Router
- Zustand (state management)

### Backend

- hono (api + business logic)
- sqlite
- Drizzle ORM
- Zod (schema validation)

#### Authentication

- better-auth

#### Tooling

- npm
- biome (tooltip)

#### Testing

- Playwright

#### Deployment

- Cloudflare Pages (frontend)
- Cloudflare Workers (backend)
- Cloudflare D1 (database)

#### Other

- Use tiptap for rich text editor https://tiptap.dev
    - add extensions: character-count, filehandler (images), color
    - add file limit for filehandler 5 mb

## Requirements

### Pages

- Homepage - a landing page to pull-in users, it will display all this web app’s features. make it blank for now
- Design system page
    - Colors, typography, etc.
    - Lists common and custom component created for this project. Their variants and how to use them
- Sign-in page
- Sign-up page
- Create quiz page - `/q/new`
- Create survey page - `/s/new`
- Explore page - `/explore`
    - Feed page - it will show quiz created by other users
- Quiz page - `/q/[id]`
    - The actual questionnaire page - identified by id
- User profile page - `/user/[username]`
    - Lists created quiz by the user - published and drafts
    - List of “Liked” quiz

### UI/UX Design

- Refer to docs/ui/questionnaire-wireframes.pdf for look and feel of the app
- Multiple themes
    - default theme is white
    - create dark theme
    - option to add more theme
    - theme can be change using a switch field at top right of the page in header. Next to it is a dropdown that can choose other custom theme
    - I should be able to add a new theme with a file
- Inter font
- 

#### Sidebar

- There is a sidebar for all pages except sign-in, sign-up, and quiz page
- Sidebar should have a category section
- Option to minimize sidebar. When minimized, only icons will show

#### Quiz Page

- Has a progress bar with fixed position on top. Color is based on selected theme
- No sidebar shown. Minimal design focus on quiz

### Questionnaire Types

- Quiz
    - Has results screen
- Survey
    - No wrong answers
    - A result screen with customizable message after answering all questions
- Scale
    - A questionnaire that uses radio buttons to measure opinions or behavioral intent (like "Most Likely" to "Least Likely") for a single statement or question that you evaluate using a quantitative scale.
    - Customizable rating scale and label. Minimum of 2
    - Labels are optional
    - Custom way to calculate results like a personality test
    - Customizable results screen

### Create Quiz Page

- Form fields
    - Question Type - a tab group in a single row
    - Question Prompt - a rich text editor
    - Answer options - based on select question type
    - Optional - switch field, all fields are required unless this is true
- Four question types
    - Single - Radio group, where only 1 possible answer
    - Multiple - Checkboxes, 1 or more answers
    - Short - text field, user can put multiple acceptable answers
    - Long - text area field, long answers are not auto-graded
- Section to set quiz-wide settings
    - Title
    - Visibility - Public or Private
        - If private, it should only be accessible thru the generated link - not displayed in explore page
    - Category - dropdown add few sample categories
    - Subcategory (optional) - based on category
    - Shows answer on result - a switch field, shows answer on results screen
    - One question at a time - a switch field, has next or back and show submit on last question
    - Paginated - a switch field, only shows and can only be selected when one question per page is true. Should be able to switch to a specific question based on question number
    - Fixed answer - a switch field, only shows and  can only be selected when one question per page is true. Hide the back button, user can only go forward with the quiz.
- The quiz-wide settings should have tooltip to explain describe further settings
- Has action buttons to Preview, Save (saves as draft), Publish
- Section to customize results screen - score and custom message
- User should be able to preview a quiz until results screen while creating or editing a quiz
- Sortable questions via dragging
- Can group questions in sections

### Quiz Page

- A page for the quiz questionnaire
- identified by id in route `/q/[id]`
- Results screen
    - After submitting the quiz, results screen should be shown
    - Option to “Like” a quiz

### Explore Page

- List of quiz created by users using card design
- List is based on the category and ranked by ranking based on likes

### Profile Page

- Avatar, and username should be displayed
- Settings section where user has option to change password, avatar, and email
- Avatar image should be circle, add file limit 10mb
- the profile page route is /user/[username]

### Authentication

- Any user can answer or create a questionnaire - no need to sign-in or sign-up
- User sign-up form needs: username, password, and email
- User can login with either username or email, and password

### Users

Three roles:

- User
    - normal user created via sign-up page
    - can create, edit, and delete their own questionnaires
    - can view all publicly available questionnaires
- Moderator
    - can moderate (view and delete) all existing questionnaires
    - created by admin via admin dashboard
- Admin
    - highest privilege
    - can create, edit, and delete any questionnaires
    - can create user and moderator accounts via dashboard
    - on login, there should be a dashboard page for admin


### Blog Page

- blog page routes to `/blog/` where it lists all blog posts
- blog content is in `/blog/[slug]`
- blog content should come from a single folder where it has .md files like how astro do it
