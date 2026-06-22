"use client";

import type { Group, Post, Theme, User } from "@mewri/core";
import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  BACK_TO_TODAY_LABEL,
  clampCaption,
  dismissGestureGuide,
  formatPostTime,
  GESTURE_GUIDE_TEXT,
  getMemberInitials,
  GROUPS_CREATE_LABEL,
  GROUPS_CURRENT_LABEL,
  GROUPS_INVITE_LABEL,
  GROUPS_JOINED_LABEL,
  GROUPS_PANEL_TITLE,
  isGestureGuideDismissed,
  LOCAL_DEMO_COMPOSER_NOTICE,
  LOCAL_DEMO_FEED_NOTICE,
  LOCAL_DEMO_GROUP_SWITCH_UNAVAILABLE,
  LOCAL_DEMO_JOINED_GROUPS,
  LOCAL_DEMO_NOTICE_BODY,
  LOCAL_DEMO_NOTICE_TITLE,
  LOCAL_DEMO_PROFILE_STATS,
  LOCAL_DEMO_UNAVAILABLE_FEATURE_NOTICE,
  OPEN_GROUPS_LABEL,
  OPEN_PROFILE_LABEL,
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
  PROFILE_EDIT_LABEL,
  PROFILE_FOLLOWERS_LABEL,
  PROFILE_FOLLOWING_LABEL,
  PROFILE_PANEL_TITLE,
  PROFILE_POSTS_TITLE,
  PROFILE_SETTINGS_LABEL,
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

export type TodayGestureHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
};

type TodayScreenProps = {
  currentUser: User;
  groupName: string;
  members: User[];
  themeTitle: string;
  themeDescription?: string;
  submitNotice: string;
  onOpenPhotoSource: () => void;
  onOpenFeed: () => void;
  onOpenProfile: () => void;
  onOpenGroups: () => void;
  gestureDisabled?: boolean;
  gestureHandlers?: TodayGestureHandlers;
  cameraButtonRef: React.RefObject<HTMLButtonElement | null>;
};

export function TodayScreen({
  currentUser,
  groupName,
  members,
  themeTitle,
  themeDescription,
  submitNotice,
  onOpenPhotoSource,
  onOpenFeed,
  onOpenProfile,
  onOpenGroups,
  gestureDisabled = false,
  gestureHandlers,
  cameraButtonRef
}: TodayScreenProps) {
  return (
    <section
      className={`sevenBamToday${gestureDisabled ? " sevenBamToday--gestureDisabled" : ""}`}
      aria-labelledby="seven-bam-today-theme"
      onPointerDown={gestureHandlers?.onPointerDown}
      onPointerMove={gestureHandlers?.onPointerMove}
      onPointerUp={gestureHandlers?.onPointerUp}
      onPointerCancel={gestureHandlers?.onPointerCancel}
    >
      <header className="sevenBamTodayHeader">
        <button type="button" className="sevenBamProfileAvatarButton" aria-label={OPEN_PROFILE_LABEL} onClick={onOpenProfile}>
          <span className="sevenBamProfileAvatar" aria-hidden="true">
            {currentUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUser.avatarUrl} alt="" />
            ) : (
              getMemberInitials(currentUser.displayName)
            )}
          </span>
        </button>
        <button type="button" className="sevenBamGroupOpenButton" aria-label={OPEN_GROUPS_LABEL} onClick={onOpenGroups}>
          <div className="sevenBamTodayBrandRow">
            <p className="sevenBamBrand">{SEVEN_BAM_BRAND}</p>
            <p className="sevenBamGroupName">{groupName}</p>
          </div>
          <MemberAvatars members={members} />
        </button>
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

        <button type="button" className="sevenBamFeedLink" aria-label={VIEW_FEED_LABEL} onClick={onOpenFeed}>
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

type PanelBackProps = {
  onBackToToday: () => void;
  backButtonRef?: React.RefObject<HTMLButtonElement | null>;
};

type TodayFeedProps = PanelBackProps & {
  items: TodayFeedItem[];
};

export function TodayFeed({ items, onBackToToday, backButtonRef }: TodayFeedProps) {
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

      <button ref={backButtonRef} type="button" className="sevenBamBackButton" onClick={onBackToToday}>
        {BACK_TO_TODAY_LABEL}
      </button>
    </section>
  );
}

type ProfilePanelProps = PanelBackProps & {
  user: User;
  posts: Post[];
  unavailableNotice: string;
  onUnavailableAction: () => void;
};

export function ProfilePanel({
  user,
  posts,
  unavailableNotice,
  onUnavailableAction,
  onBackToToday,
  backButtonRef
}: ProfilePanelProps) {
  return (
    <section className="sevenBamProfile" aria-labelledby="seven-bam-profile-title">
      <header className="sevenBamPanelHeader">
        <h1 id="seven-bam-profile-title" className="sevenBamPanelTitle">
          {PROFILE_PANEL_TITLE}
        </h1>
      </header>

      <div className="sevenBamProfileHero">
        <span className="sevenBamProfileHeroAvatar" aria-hidden="true">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" />
          ) : (
            getMemberInitials(user.displayName)
          )}
        </span>
        <div className="sevenBamProfileIdentity">
          <p className="sevenBamProfileName">{user.displayName}</p>
          <p className="sevenBamProfileHandle">@{user.username}</p>
        </div>
      </div>

      <dl className="sevenBamProfileStats">
        <div>
          <dt>{PROFILE_FOLLOWING_LABEL}</dt>
          <dd>{LOCAL_DEMO_PROFILE_STATS.following}</dd>
        </div>
        <div>
          <dt>{PROFILE_FOLLOWERS_LABEL}</dt>
          <dd>{LOCAL_DEMO_PROFILE_STATS.followers}</dd>
        </div>
      </dl>

      <div className="sevenBamProfileActions">
        <button type="button" className="sevenBamSecondaryButton" onClick={onUnavailableAction}>
          {PROFILE_EDIT_LABEL}
        </button>
        <button type="button" className="sevenBamGhostButton" onClick={onUnavailableAction}>
          {PROFILE_SETTINGS_LABEL}
        </button>
      </div>

      {unavailableNotice ? (
        <p className="sevenBamPanelNotice" role="status" aria-live="polite">
          {unavailableNotice}
        </p>
      ) : null}

      <section className="sevenBamProfilePosts" aria-labelledby="seven-bam-profile-posts-title">
        <h2 id="seven-bam-profile-posts-title" className="sevenBamSectionTitle">
          {PROFILE_POSTS_TITLE}
        </h2>
        {posts.length === 0 ? (
          <p className="sevenBamPanelEmpty" role="status">
            まだ投稿がありません。
          </p>
        ) : (
          <ol className="sevenBamProfilePostList">
            {posts.map((post) => (
              <li key={post.id} className="sevenBamProfilePostItem">
                <figure className="sevenBamProfilePostPhoto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.imageUrl} alt={post.caption || "自分の投稿"} />
                </figure>
                {post.caption ? <p className="sevenBamProfilePostCaption">{post.caption}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <button ref={backButtonRef} type="button" className="sevenBamBackButton" onClick={onBackToToday}>
        {BACK_TO_TODAY_LABEL}
      </button>
    </section>
  );
}

type GroupsPanelProps = PanelBackProps & {
  currentGroup: Group;
  currentMemberCount: number;
  switchNotice: string;
  onDemoGroupTap: () => void;
  onUnavailableAction: () => void;
};

export function GroupsPanel({
  currentGroup,
  currentMemberCount,
  switchNotice,
  onDemoGroupTap,
  onUnavailableAction,
  onBackToToday,
  backButtonRef
}: GroupsPanelProps) {
  const demoGroups = LOCAL_DEMO_JOINED_GROUPS.filter((group) => !group.isCurrent);

  return (
    <section className="sevenBamGroups" aria-labelledby="seven-bam-groups-title">
      <header className="sevenBamPanelHeader">
        <h1 id="seven-bam-groups-title" className="sevenBamPanelTitle">
          {GROUPS_PANEL_TITLE}
        </h1>
      </header>

      <section className="sevenBamGroupsCurrent" aria-labelledby="seven-bam-groups-current-title">
        <h2 id="seven-bam-groups-current-title" className="sevenBamSectionTitle">
          {GROUPS_CURRENT_LABEL}
        </h2>
        <div className="sevenBamGroupsCard sevenBamGroupsCard--current">
          <p className="sevenBamGroupsName">{currentGroup.name}</p>
          <p className="sevenBamGroupsMeta">{currentMemberCount}人のメンバー</p>
        </div>
      </section>

      <div className="sevenBamGroupsActions">
        <button type="button" className="sevenBamSecondaryButton" onClick={onUnavailableAction}>
          {GROUPS_CREATE_LABEL}
        </button>
        <button type="button" className="sevenBamGhostButton" onClick={onUnavailableAction}>
          {GROUPS_INVITE_LABEL}
        </button>
      </div>

      {switchNotice ? (
        <p className="sevenBamPanelNotice" role="status" aria-live="polite">
          {switchNotice}
        </p>
      ) : null}

      <section className="sevenBamGroupsJoined" aria-labelledby="seven-bam-groups-joined-title">
        <h2 id="seven-bam-groups-joined-title" className="sevenBamSectionTitle">
          {GROUPS_JOINED_LABEL}
        </h2>
        <ul className="sevenBamGroupsList">
          {demoGroups.map((group) => (
            <li key={group.id}>
              <button type="button" className="sevenBamGroupsCard" onClick={onDemoGroupTap}>
                <span className="sevenBamGroupsName">{group.name}</span>
                <span className="sevenBamGroupsMeta">{group.memberCount}人</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <button ref={backButtonRef} type="button" className="sevenBamBackButton" onClick={onBackToToday}>
        {BACK_TO_TODAY_LABEL}
      </button>
    </section>
  );
}

type GestureGuideProps = {
  onDismiss: () => void;
};

export function GestureGuide({ onDismiss }: GestureGuideProps) {
  return (
    <div className="sevenBamGestureGuide" role="status" aria-live="polite">
      <p className="sevenBamGestureGuideText">{GESTURE_GUIDE_TEXT}</p>
      <button type="button" className="sevenBamGestureGuideDismiss" onClick={onDismiss}>
        閉じる
      </button>
    </div>
  );
}

export function useGestureGuideVisible(): [boolean, () => void] {
  const [visible, setVisible] = useState(() => !isGestureGuideDismissed());

  function dismiss() {
    dismissGestureGuide();
    setVisible(false);
  }

  return [visible, dismiss];
}

export type { Theme };
