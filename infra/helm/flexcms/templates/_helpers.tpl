{{/*
Expand the name of the chart.
*/}}
{{- define "flexcms.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this.
*/}}
{{- define "flexcms.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label (chart name + version).
*/}}
{{- define "flexcms.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "flexcms.labels" -}}
helm.sh/chart: {{ include "flexcms.chart" . }}
{{ include "flexcms.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels — used by Deployments and Services to match pods.
The 'component' value must be passed as an extra dict key.
Usage: include "flexcms.selectorLabels" (dict "Values" .Values "Release" .Release "Chart" .Chart "component" "author")
*/}}
{{- define "flexcms.selectorLabels" -}}
app.kubernetes.io/name: {{ include "flexcms.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Component-specific selector labels (adds component key).
*/}}
{{- define "flexcms.componentSelectorLabels" -}}
app.kubernetes.io/name: {{ include "flexcms.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
ServiceAccount name.
*/}}
{{- define "flexcms.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "flexcms.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Name of the Secret that holds application credentials.
*/}}
{{- define "flexcms.secretName" -}}
{{- printf "%s-credentials" (include "flexcms.fullname" .) }}
{{- end }}

{{/*
PostgreSQL password: prefer existingSecret, else use value.
*/}}
{{- define "flexcms.postgresql.password" -}}
{{- if .Values.postgresql.existingSecret }}
secretKeyRef:
  name: {{ .Values.postgresql.existingSecret }}
  key: postgresql-password
{{- else }}
secretKeyRef:
  name: {{ include "flexcms.secretName" . }}
  key: postgresql-password
{{- end }}
{{- end }}

{{/*
RabbitMQ password.
*/}}
{{- define "flexcms.rabbitmq.password" -}}
{{- if .Values.rabbitmq.existingSecret }}
secretKeyRef:
  name: {{ .Values.rabbitmq.existingSecret }}
  key: rabbitmq-password
{{- else }}
secretKeyRef:
  name: {{ include "flexcms.secretName" . }}
  key: rabbitmq-password
{{- end }}
{{- end }}

{{/*
S3 secret access key.
*/}}
{{- define "flexcms.s3.secretAccessKey" -}}
{{- if .Values.s3.existingSecret }}
secretKeyRef:
  name: {{ .Values.s3.existingSecret }}
  key: s3-secret-access-key
{{- else }}
secretKeyRef:
  name: {{ include "flexcms.secretName" . }}
  key: s3-secret-access-key
{{- end }}
{{- end }}

{{/*
S3 access key id.
*/}}
{{- define "flexcms.s3.accessKeyId" -}}
{{- if .Values.s3.existingSecret }}
secretKeyRef:
  name: {{ .Values.s3.existingSecret }}
  key: s3-access-key-id
{{- else }}
secretKeyRef:
  name: {{ include "flexcms.secretName" . }}
  key: s3-access-key-id
{{- end }}
{{- end }}

{{/*
Common backend environment variables (shared by author and publish).
*/}}
{{- define "flexcms.backendEnv" -}}
- name: SPRING_DATA_REDIS_HOST
  value: {{ .Values.redis.host | quote }}
- name: SPRING_DATA_REDIS_PORT
  value: {{ .Values.redis.port | quote }}
- name: SPRING_RABBITMQ_HOST
  value: {{ .Values.rabbitmq.host | quote }}
- name: SPRING_RABBITMQ_PORT
  value: {{ .Values.rabbitmq.port | quote }}
- name: SPRING_RABBITMQ_USERNAME
  value: {{ .Values.rabbitmq.username | quote }}
- name: SPRING_RABBITMQ_PASSWORD
  valueFrom:
    {{- include "flexcms.rabbitmq.password" . | nindent 4 }}
- name: SPRING_ELASTICSEARCH_URIS
  value: {{ .Values.elasticsearch.uris | quote }}
- name: FLEXCMS_DAM_S3_ENDPOINT
  value: {{ .Values.s3.endpoint | quote }}
- name: FLEXCMS_DAM_S3_BUCKET
  value: {{ .Values.s3.bucket | quote }}
- name: FLEXCMS_DAM_S3_REGION
  value: {{ .Values.s3.region | quote }}
- name: FLEXCMS_DAM_S3_ACCESS_KEY
  valueFrom:
    {{- include "flexcms.s3.accessKeyId" . | nindent 4 }}
- name: FLEXCMS_DAM_S3_SECRET_KEY
  valueFrom:
    {{- include "flexcms.s3.secretAccessKey" . | nindent 4 }}
- name: FLEXCMS_JWT_ISSUER_URI
  value: {{ .Values.security.jwt.issuerUri | quote }}
{{- end }}

