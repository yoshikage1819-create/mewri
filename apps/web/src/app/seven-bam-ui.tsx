"use client";

import type { Post, Theme, User } from "@mewri/core";
import { useEffect, useId, useRef } from "react";
import {
  BACK_TO_TODAY_LABEL,
  clampCaption,
  formatPostTime,
  getMemberInitials,
  LOCAL_DEMO_COMPOSER_NOTICE,
  LOCAL_DEMO_FEED_NOTICE,
  LOCAL_DEMO_NOTICE_BODY,
  LOCAL_DEMO_NOTICE_TITLE,
  PHOTO_COMPOSER_CANCEL_LABEL,
  PHOTO_COMPOSER_RESELECT_LIBRARY_LABEL,
  PHOTO_COMPOSER_RETAKE_CAMERA_LABEL,
  PHOTO_COMPOSER_SUBMIT_LABEL,
  PHOTO_SOURCE_CAMERA_LABEL,
  PHOTO_SOURCE_CANCEL_LABEL,
  PHOTO_SOURCE_LIBRARY_LABEL,
  PHOTO_SOURCE_SHEET_ID,
  PHOTO_SOURCE_SHEET_TITLE,
  PHOTO_SOURCE_SHEET_TITLE_ID,
  type PhotoPickerSource,
  POST_CAMERA_BUTTON_LABEL,
  SEVEN_BAM_BRAND,
  SEVEN_BAM_CAPTION_MAX_CHARS,
  TODAY_FEED_EMPTY_HINT,
  TODAY_FEED_EMPTY_TITLE,
  TODAY_FEED_TITLE,
  TODAY_THEME_LABEL,
  VIEW_FEED_LABEL,
  formatRemainingToday
} from "./local-demo-ui";

export type TodayFeedItem = {
  post: Post;
  user?: User;
};

type MemberAvatarsProps = {
  members: User[];
};

export function MemberAvatars({ members }: MemberAvatarsProps) {
  if (members.length === 0) return null;
  return (
    <ul className="sevenBamMemberRow" aria-label="グループメンバー">
      {members.map((member) => (
        <li key={member.id}>
          <span className="sevenBamMemberAvatar" aria-hidden="true">
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.avatarUrl} alt="" />
            ) : (
              getMemberInitials(member.displayName)
            )}
          </span>
          <span className="srOnly">{member.displayName}</span>
        </li>
      ))}
    </ul>
  );
}

type TodayScreenProps = {
  groupName: string;
  members: User[];
  themeTitle: string;
  themeDescription?: string;
  submitNotice: string;
  onOpenPhotoSource: () => void;
  onOpenFeed: () => void;
  cameraButtonRef: React.RefObject<HTMLButtonElement | null>;
};

export function TodayScreen({
  groupName,
  members,
  themeTitle,
  themeDescription,
  submitNotice,
  onOpenPhotoSource,
  onOpenFeed,
  cameraButtonRef
}: TodayScreenProps) {
  return (
    <section className="sevenBamToday" aria-labelledby="seven-bam-today-theme">
      <header className="sevenBamTodayHeader">
        <div className="sevenBamTodayBrandRow">
          <p className="sevenBamBrand">{SEVEN_BAM_BRAND}</p>
          <p className="sevenBamGroupName">{groupName}</p>
        </div>
        <MemberAvatars members={members} />
      </header>

      <div className="sevenBamTodayBody">
        <p className="sevenBamThemeLabel">{TODAY_THEME_LABEL}</p>
        <h1 className="sevenBamThemeTitle" id="seven-bam-today-theme">
          {themeTitle}
        </h1>
        {themeDescription ? <p className="sevenBamThemeDescription">{themeDescription}</p> : null}
        <p className="sevenBamRemaining" role="status">
          {formatRemainingToday()}
        </p>
      </div>

      <div className="sevenBamTodayActions">
        <button
          ref={cameraButtonRef}
          type="button"
          className="sevenBamCameraButton"
          aria-label={POST_CAMERA_BUTTON_LABEL}
          onClick={onOpenPhotoSource}
        >
          <span className="sevenBamCameraIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4.5 8.5h2.2l1.4-2h8.8l1.4 2H20a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-8.5a2 2 0 0 1 2-2Z" />
              <circle cx="12.2" cy="13.5" r="3.4" />
            </svg>
          </span>
          <span className="sevenBamCameraLabel">投稿する</span>
        </button>

        <button type="button" className="sevenBamFeedLink" onClick={onOpenFeed}>
          {VIEW_FEED_LABEL}
        </button>
      </div>

      <p className="sevenBamLocalNotice" aria-label="ローカルデモの説明">
        <strong>{LOCAL_DEMO_NOTICE_TITLE}</strong>
        <span>{LOCAL_DEMO_NOTICE_BODY}</span>
      </p>

      {submitNotice ? (
        <p className="sevenBamSubmitNotice" role="status" aria-live="polite">
          {submitNotice}
        </p>
      ) : null}
    </section>
  );
}

type PhotoSourceSheetProps = {
  open: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickLibrary: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Tab" && focusable.length > 0) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    container.addEventListener("keydown", onKeyDown);
    return () => container.removeEventListener("keydown", onKeyDown);
  }, [active, containerRef]);
}

export function PhotoSourceSheet({ open, onClose, onPickCamera, onPickLibrary, returnFocusRef }: PhotoSourceSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = PHOTO_SOURCE_SHEET_TITLE_ID;
  useFocusTrap(open, dialogRef);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        returnFocusRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;

  return (
    <div className="sevenBamSheetBackdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        id={PHOTO_SOURCE_SHEET_ID}
        className="sevenBamSheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="sevenBamSheetTitle">
          {PHOTO_SOURCE_SHEET_TITLE}
        </h2>
        <div className="sevenBamSheetActions">
          <button type="button" className="sevenBamSheetAction" onClick={onPickCamera}>
            {PHOTO_SOURCE_CAMERA_LABEL}
          </button>
          <button type="button" className="sevenBamSheetAction" onClick={onPickLibrary}>
            {PHOTO_SOURCE_LIBRARY_LABEL}
          </button>
          <button
            type="button"
            className="sevenBamSheetCancel"
            onClick={() => {
              onClose();
              returnFocusRef.current?.focus();
            }}
          >
            {PHOTO_SOURCE_CANCEL_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}

type PhotoComposerProps = {
  open: boolean;
  themeTitle: string;
  previewUrl: string;
  source: PhotoPickerSource;
  caption: string;
  errorMessage: string;
  submitting: boolean;
  onCaptionChange: (value: string) => void;
  onSubmit: () => void;
  onRetake: () => void;
  onCancel: () => void;
};

export function PhotoComposer({
  open,
  themeTitle,
  previewUrl,
  source,
  caption,
  errorMessage,
  submitting,
  onCaptionChange,
  onSubmit,
  onRetake,
  onCancel
}: PhotoComposerProps) {
  const captionId = useId();
  const errorId = useId();

  if (!open) return null;

  return (
    <section className="sevenBamComposer" aria-labelledby="seven-bam-composer-title">
      <header className="sevenBamComposerHeader">
        <p className="sevenBamComposerDemo">{LOCAL_DEMO_NOTICE_TITLE}</p>
        <h2 id="seven-bam-composer-title" className="sevenBamComposerTheme">
          {themeTitle}
        </h2>
      </header>

      <figure className="sevenBamComposerPreview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="選択した写真のプレビュー" />
      </figure>

      <label className="sevenBamCaptionField" htmlFor={captionId}>
        <span>ひとこと（任意）</span>
        <textarea
          id={captionId}
          value={caption}
          rows={2}
          maxLength={SEVEN_BAM_CAPTION_MAX_CHARS}
          placeholder="80文字まで"
          aria-describedby={errorMessage ? errorId : undefined}
          onChange={(event) => onCaptionChange(clampCaption(event.target.value))}
        />
        <span className="sevenBamCaptionCount" aria-live="polite">
          {caption.length}/{SEVEN_BAM_CAPTION_MAX_CHARS}
        </span>
      </label>

      {errorMessage ? (
        <p id={errorId} className="sevenBamComposerError" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <p className="sevenBamComposerNotice">{LOCAL_DEMO_COMPOSER_NOTICE}</p>

      <div className="sevenBamComposerActions">
        <button type="button" className="sevenBamPrimaryButton" disabled={submitting} onClick={onSubmit}>
          {PHOTO_COMPOSER_SUBMIT_LABEL}
        </button>
        <button type="button" className="sevenBamSecondaryButton" onClick={onRetake}>
          {source === "camera" ? PHOTO_COMPOSER_RETAKE_CAMERA_LABEL : PHOTO_COMPOSER_RESELECT_LIBRARY_LABEL}
        </button>
        <button type="button" className="sevenBamGhostButton" onClick={onCancel}>
          {PHOTO_COMPOSER_CANCEL_LABEL}
        </button>
      </div>
    </section>
  );
}

type TodayFeedProps = {
  items: TodayFeedItem[];
  onBackToToday: () => void;
};

export function TodayFeed({ items, onBackToToday }: TodayFeedProps) {
  return (
    <section className="sevenBamFeed" aria-labelledby="seven-bam-feed-title">
      <header className="sevenBamFeedHeader">
        <h1 id="seven-bam-feed-title" className="sevenBamFeedTitle">
          {TODAY_FEED_TITLE}
        </h1>
        <p className="sevenBamFeedNotice">{LOCAL_DEMO_FEED_NOTICE}</p>
      </header>

      {items.length === 0 ? (
        <div className="sevenBamFeedEmpty" role="status">
          <p className="sevenBamFeedEmptyTitle">{TODAY_FEED_EMPTY_TITLE}</p>
          <p className="sevenBamFeedEmptyHint">{TODAY_FEED_EMPTY_HINT}</p>
        </div>
      ) : (
        <ol className="sevenBamFeedList">
          {items.map(({ post, user }) => {
            const timeLabel = formatPostTime(post.createdAt);
            return (
              <li key={post.id} className="sevenBamFeedItem">
                <figure className="sevenBamFeedPhoto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.imageUrl} alt={post.caption || user?.displayName || "今日の投稿"} />
                </figure>
                <div className="sevenBamFeedMeta">
                  <div className="sevenBamFeedAuthor">
                    <span className="sevenBamFeedAvatar" aria-hidden="true">
                      {user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt="" />
                      ) : (
                        getMemberInitials(user?.displayName ?? "?")
                      )}
                    </span>
                    <span className="sevenBamFeedName">{user?.displayName ?? "メンバー"}</span>
                    {timeLabel ? <time className="sevenBamFeedTime" dateTime={post.createdAt}>{timeLabel}</time> : null}
                  </div>
                  {post.caption ? <p className="sevenBamFeedCaption">{post.caption}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <button type="button" className="sevenBamBackButton" onClick={onBackToToday}>
        {BACK_TO_TODAY_LABEL}
      </button>
    </section>
  );
}

export type { Theme };
